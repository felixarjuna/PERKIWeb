import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { libraryBooks, libraryEvents, users } from "~/lib/db/schema/schema";
import {
  type BookState,
  inShelfState,
  LIBRARY_SHOWS,
  LIBRARY_SORTS,
  MAX_AUTHOR,
  MAX_DESCRIPTION,
  MAX_LANGUAGE,
  MAX_TITLE,
  memberBookState,
  SHELF_STATES,
  shownFor,
  sortBooks,
} from "~/lib/library";
import { db } from "~/server";
import { lockBook, logEvent, refreshStatus, statesOf } from "~/server/library";
import { isPgError, PG_FOREIGN_KEY_VIOLATION } from "../errors";
import { matchesWords } from "../paging";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "../trpc";

const MAX_QUERY = 200;

/** Empty optional text is stored as null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || null);

const bookInput = z.object({
  author: z.string().trim().min(1, "Add the author.").max(MAX_AUTHOR),
  description: optionalText(MAX_DESCRIPTION),
  language: optionalText(MAX_LANGUAGE),
  /** The member who lends it; null when PERKI owns it. */
  ownerId: z.string().min(1).nullable(),
  title: z.string().trim().min(1, "Add the title.").max(MAX_TITLE),
});

const EDITABLE = [
  "title",
  "author",
  "language",
  "description",
  "ownerId",
] as const;

const ownerMissing = (error: unknown) => {
  if (isPgError(error, PG_FOREIGN_KEY_VIOLATION)) {
    throw new TRPCError({
      cause: error,
      code: "NOT_FOUND",
      message: "Owner not found.",
    });
  }
  throw error;
};

/** Who has the book or has it held for them, for staff. */
const personWith = (state: BookState) => {
  if (state.kind === "borrowed") {
    return state.holderId;
  }
  return state.kind === "reserved" ? state.reservedFor : null;
};

/** Names and photos of the given accounts, keyed by id. */
async function peopleById(ids: (string | null | undefined)[]) {
  const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (wanted.length === 0) {
    return new Map<string, { image: string | null; name: string }>();
  }
  const rows = await db
    .select({ id: users.id, image: users.image, name: users.name })
    .from(users)
    .where(inArray(users.id, wanted));
  return new Map(
    rows.map((row) => [
      row.id,
      { image: row.image, name: row.name ?? "Unnamed account" },
    ])
  );
}

export const libraryRouter = createTRPCRouter({
  /** Staff: adds a book straight onto the shelf, PERKI's or a member's. */
  add: adminProcedure.input(bookInput).mutation(({ ctx, input }) =>
    db
      .transaction(async (tx) => {
        const actorId = ctx.session.user.id;
        const [book] = await tx
          .insert(libraryBooks)
          .values({
            ...input,
            acceptedAt: new Date(),
            createdById: actorId,
            status: "available",
          })
          .returning({ id: libraryBooks.id });
        if (!book) {
          throw new Error("Failed to add the book");
        }
        await logEvent(tx, {
          actorId,
          bookId: book.id,
          details: { author: input.author, title: input.title },
          subjectId: input.ownerId,
          type: "added",
        });
        return book;
      })
      .catch(ownerMissing)
  ),

  /** Staff: one book's history, newest first, with who did what. */
  history: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const [book] = await db
        .select({ id: libraryBooks.id, title: libraryBooks.title })
        .from(libraryBooks)
        .where(eq(libraryBooks.id, input.id));
      if (!book) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Book not found." });
      }
      const events = await db
        .select()
        .from(libraryEvents)
        .where(eq(libraryEvents.bookId, input.id))
        .orderBy(desc(libraryEvents.at), desc(libraryEvents.id));
      const people = await peopleById(
        events.flatMap((event) => [event.actorId, event.subjectId])
      );
      const nameOf = (id: string | null) =>
        id ? (people.get(id)?.name ?? "Removed account") : null;
      return {
        events: events.map((event) => ({
          actor: nameOf(event.actorId),
          at: event.at,
          details: event.details,
          id: event.id,
          subject: nameOf(event.subjectId),
          type: event.type,
        })),
        title: book.title,
      };
    }),

  /**
   * Signed-in members: every book that hasn't left the library, with its
   * state as they may see it. Never says who holds or lent a book.
   */
  list: protectedProcedure
    .input(
      z.object({
        q: z.string().max(MAX_QUERY).optional(),
        show: z.enum(LIBRARY_SHOWS).default("all"),
        sort: z.enum(LIBRARY_SORTS).default("available"),
      })
    )
    .query(async ({ ctx, input }) => {
      const books = await db
        .select({
          addedAt: libraryBooks.createdAt,
          author: libraryBooks.author,
          description: libraryBooks.description,
          id: libraryBooks.id,
          language: libraryBooks.language,
          status: libraryBooks.status,
          title: libraryBooks.title,
        })
        .from(libraryBooks)
        .where(
          and(
            ne(libraryBooks.status, "withdrawn"),
            input.q
              ? matchesWords([libraryBooks.title, libraryBooks.author], input.q)
              : undefined
          )
        )
        .orderBy(asc(libraryBooks.id));
      const states = await statesOf(db, books);
      const items = books
        .map(({ status: _status, ...book }) => ({
          ...book,
          state: memberBookState(
            states.get(book.id) ?? { kind: "available", queue: 0 },
            ctx.session.user.id
          ),
        }))
        .filter((book) => shownFor(book.state, input.show));
      return sortBooks(items, input.sort);
    }),

  /**
   * Staff: the shelf with who lent and who holds each book, its due date and
   * queue. "shelf" (the default) leaves withdrawn books out.
   */
  manage: adminProcedure
    .input(
      z.object({
        q: z.string().max(MAX_QUERY).optional(),
        state: z.enum(SHELF_STATES).default("shelf"),
      })
    )
    .query(async ({ input }) => {
      const books = await db
        .select()
        .from(libraryBooks)
        .where(
          input.q
            ? matchesWords([libraryBooks.title, libraryBooks.author], input.q)
            : undefined
        )
        .orderBy(asc(libraryBooks.title), asc(libraryBooks.id));
      const states = await statesOf(db, books);
      const shown = books.filter((book) => {
        const state = states.get(book.id);
        return state ? inShelfState(state, input.state) : false;
      });
      const people = await peopleById(
        shown.flatMap((book) => {
          const state = states.get(book.id);
          return [book.ownerId, state ? personWith(state) : null];
        })
      );
      return shown.map((book) => {
        const state = states.get(book.id) ?? { kind: "available", queue: 0 };
        const holderId = personWith(state);
        return {
          addedAt: book.createdAt,
          author: book.author,
          description: book.description,
          dueOn: state.kind === "borrowed" ? state.dueOn : null,
          holdEndsOn: state.kind === "reserved" ? state.holdEndsOn : null,
          holder: holderId ? (people.get(holderId)?.name ?? null) : null,
          id: book.id,
          kind: state.kind,
          language: book.language,
          overdue: state.kind === "borrowed" && state.overdue,
          owner: book.ownerId
            ? {
                id: book.ownerId,
                name: people.get(book.ownerId)?.name ?? "Unnamed account",
              }
            : null,
          queue: "queue" in state ? state.queue : 0,
          title: book.title,
        };
      });
    }),

  /** Staff: brings a withdrawn book back onto the shelf. */
  restore: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) =>
      db.transaction(async (tx) => {
        const book = await lockBook(tx, input.id);
        if (book.status !== "withdrawn") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This book is already in the library.",
          });
        }
        // Back on the shelf; the derived state decides the rest.
        await tx
          .update(libraryBooks)
          .set({
            acceptedAt: book.acceptedAt ?? new Date(),
            status: "available",
          })
          .where(eq(libraryBooks.id, book.id));
        const status = await refreshStatus(tx, {
          id: book.id,
          status: "available",
        });
        await logEvent(tx, {
          actorId: ctx.session.user.id,
          bookId: book.id,
          type: "restored",
        });
        return { id: book.id, status };
      })
    ),

  /** Staff: changes a book's details or who lent it. */
  update: adminProcedure
    .input(bookInput.extend({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) =>
      db
        .transaction(async (tx) => {
          const { id, ...values } = input;
          const book = await lockBook(tx, id);
          const changed = EDITABLE.filter((key) => book[key] !== values[key]);
          if (changed.length === 0) {
            return { id };
          }
          await tx
            .update(libraryBooks)
            .set(values)
            .where(eq(libraryBooks.id, id));
          await logEvent(tx, {
            actorId: ctx.session.user.id,
            bookId: id,
            details: { changed },
            subjectId: changed.includes("ownerId") ? values.ownerId : null,
            type: "edited",
          });
          return { id };
        })
        .catch(ownerMissing)
    ),

  /**
   * Staff: takes a book out of the library (its owner asked for it back, or
   * it's lost). It keeps its history and leaves the member list.
   */
  withdraw: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) =>
      db.transaction(async (tx) => {
        const book = await lockBook(tx, input.id);
        if (book.status === "withdrawn") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This book is already withdrawn.",
          });
        }
        await tx
          .update(libraryBooks)
          .set({ status: "withdrawn" })
          .where(eq(libraryBooks.id, book.id));
        await logEvent(tx, {
          actorId: ctx.session.user.id,
          bookId: book.id,
          type: "withdrawn",
        });
        return { id: book.id };
      })
    ),
});
