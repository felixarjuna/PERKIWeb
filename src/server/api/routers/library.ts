import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import {
  libraryBooks,
  libraryEvents,
  libraryLoans,
  users,
} from "~/lib/db/schema/schema";
import {
  type BookState,
  extendedDueOn,
  extendRefusal,
  inShelfState,
  isOverdue,
  LIBRARY_SHOWS,
  LIBRARY_SORTS,
  MAX_AUTHOR,
  MAX_DESCRIPTION,
  MAX_LANGUAGE,
  MAX_LOAN_NOTE,
  MAX_TITLE,
  memberBookState,
  SHELF_STATES,
  shownFor,
  sortBooks,
} from "~/lib/library";
import { db } from "~/server";
import {
  libraryToday,
  loadLending,
  lockBook,
  logEvent,
  openLoanOf,
  refreshStatus,
  startLoan,
  statesOf,
} from "~/server/library";
import {
  isPgError,
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
} from "../errors";
import { matchesWords } from "../paging";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "../trpc";

const MAX_QUERY = 200;
/** Past borrows My books lists, newest first. */
const MAX_PAST_LOANS = 20;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

const bookId = z.object({ id: z.number().int().positive() });

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

/**
 * A second loan that slipped past the check (the partial unique index) reads
 * as the book being out; a missing member as NOT_FOUND.
 */
const loanFailed = (error: unknown) => {
  if (isPgError(error, PG_UNIQUE_VIOLATION)) {
    throw new TRPCError({
      cause: error,
      code: "CONFLICT",
      message: "Someone has borrowed this book.",
    });
  }
  if (isPgError(error, PG_FOREIGN_KEY_VIOLATION)) {
    throw new TRPCError({
      cause: error,
      code: "NOT_FOUND",
      message: "Member not found.",
    });
  }
  throw error;
};

const noOpenLoan = () =>
  new TRPCError({
    code: "BAD_REQUEST",
    message: "This book isn't out with anyone.",
  });

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

  /**
   * Signed-in members, with the book in hand at the shelf: starts their loan,
   * due in `LOAN_DAYS`. Only staff's Mark returned ends it.
   */
  borrow: protectedProcedure.input(bookId).mutation(({ ctx, input }) =>
    db
      .transaction((tx) =>
        startLoan(tx, {
          actorId: ctx.session.user.id,
          bookId: input.id,
          userId: ctx.session.user.id,
        })
      )
      .catch(loanFailed)
  ),

  /**
   * The holder: moves the due date `LOAN_DAYS` on, at most `MAX_EXTENSIONS`
   * times, not after it's due and not while anyone waits.
   */
  extend: protectedProcedure
    .input(z.object({ loanId: z.number().int().positive() }))
    .mutation(({ ctx, input }) =>
      db.transaction(async (tx) => {
        const viewerId = ctx.session.user.id;
        const [found] = await tx
          .select({ bookId: libraryLoans.bookId })
          .from(libraryLoans)
          .where(
            and(
              eq(libraryLoans.id, input.loanId),
              eq(libraryLoans.userId, viewerId)
            )
          );
        if (!found) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Loan not found.",
          });
        }
        const book = await lockBook(tx, found.bookId);
        const loan = await openLoanOf(tx, book.id);
        if (loan?.id !== input.loanId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This book has already been returned.",
          });
        }
        const today = libraryToday();
        const state = (await statesOf(tx, [book], today)).get(book.id);
        const refusal = extendRefusal(
          loan,
          viewerId,
          today,
          state && "queue" in state ? state.queue : 0
        );
        if (refusal) {
          throw new TRPCError({ code: "BAD_REQUEST", message: refusal });
        }
        const dueOn = extendedDueOn(loan.dueOn);
        await tx
          .update(libraryLoans)
          .set({ dueOn, extensions: loan.extensions + 1 })
          .where(eq(libraryLoans.id, loan.id));
        await logEvent(tx, {
          actorId: viewerId,
          bookId: book.id,
          details: { dueOn, from: loan.dueOn },
          loanId: loan.id,
          subjectId: viewerId,
          type: "extended",
        });
        return { dueOn };
      })
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

  /** Staff: lends a book to a named member, e.g. one without a phone at hand. */
  lend: adminProcedure
    .input(bookId.extend({ userId: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      db
        .transaction((tx) =>
          startLoan(tx, {
            actorId: ctx.session.user.id,
            bookId: input.id,
            byHand: true,
            userId: input.userId,
          })
        )
        .catch(loanFailed)
    ),

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
      const openLoans = shown.length
        ? await db
            .select({
              bookId: libraryLoans.bookId,
              extensions: libraryLoans.extensions,
            })
            .from(libraryLoans)
            .where(
              and(
                inArray(
                  libraryLoans.bookId,
                  shown.map((book) => book.id)
                ),
                isNull(libraryLoans.returnedAt)
              )
            )
        : [];
      const extensions = new Map(
        openLoans.map((loan) => [loan.bookId, loan.extensions])
      );
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
          extensions: extensions.get(book.id) ?? 0,
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

  /**
   * Staff, when the book is back on the shelf: ends its open loan. The only
   * way a loan ends; the next Borrow never counts as the return.
   */
  markReturned: adminProcedure.input(bookId).mutation(({ ctx, input }) =>
    db.transaction(async (tx) => {
      const book = await lockBook(tx, input.id);
      const loan = await openLoanOf(tx, book.id);
      if (!loan) {
        throw noOpenLoan();
      }
      const actorId = ctx.session.user.id;
      await tx
        .update(libraryLoans)
        .set({ returnedAt: new Date(), returnedById: actorId })
        .where(eq(libraryLoans.id, loan.id));
      const status = await refreshStatus(tx, book);
      await logEvent(tx, {
        actorId,
        bookId: book.id,
        details: { dueOn: loan.dueOn },
        loanId: loan.id,
        subjectId: loan.userId,
        type: "returned",
      });
      return { id: book.id, status };
    })
  ),

  /**
   * Signed-in members: the books they hold, each with its due date and
   * whether they may extend it, and the ones they've given back.
   */
  mine: protectedProcedure.query(async ({ ctx }) => {
    const viewerId = ctx.session.user.id;
    const loans = await db
      .select({
        author: libraryBooks.author,
        bookId: libraryLoans.bookId,
        borrowedAt: libraryLoans.borrowedAt,
        dueOn: libraryLoans.dueOn,
        extensions: libraryLoans.extensions,
        loanId: libraryLoans.id,
        returnedAt: libraryLoans.returnedAt,
        title: libraryBooks.title,
      })
      .from(libraryLoans)
      .innerJoin(libraryBooks, eq(libraryBooks.id, libraryLoans.bookId))
      .where(eq(libraryLoans.userId, viewerId))
      .orderBy(asc(libraryLoans.dueOn), asc(libraryLoans.id));
    const open = loans.filter((loan) => loan.returnedAt === null);
    const { lines } = await loadLending(
      db,
      open.map((loan) => loan.bookId)
    );
    const today = libraryToday();
    const past = loans.flatMap(({ author, borrowedAt, returnedAt, title }) =>
      returnedAt ? [{ author, borrowedAt, returnedAt, title }] : []
    );
    past.sort((a, b) => b.returnedAt.getTime() - a.returnedAt.getTime());
    return {
      holding: open.map((loan) => ({
        author: loan.author,
        bookId: loan.bookId,
        dueOn: loan.dueOn,
        extendRefusal: extendRefusal(
          { ...loan, userId: viewerId },
          viewerId,
          today,
          lines.get(loan.bookId)?.length ?? 0
        ),
        extensions: loan.extensions,
        loanId: loan.loanId,
        overdue: isOverdue(loan.dueOn, today),
        title: loan.title,
      })),
      past: past.slice(0, MAX_PAST_LOANS),
    };
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

  /**
   * Staff: sets the open loan's due date directly, past the members' limit,
   * with an optional note kept on the loan and in the history.
   */
  setDueOn: adminProcedure
    .input(
      bookId.extend({
        dueOn: z.string().regex(ISO_DAY, "Pick a date."),
        note: optionalText(MAX_LOAN_NOTE),
      })
    )
    .mutation(({ ctx, input }) =>
      db.transaction(async (tx) => {
        const book = await lockBook(tx, input.id);
        const loan = await openLoanOf(tx, book.id);
        if (!loan) {
          throw noOpenLoan();
        }
        if (input.dueOn < libraryToday()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Pick today or a later day.",
          });
        }
        await tx
          .update(libraryLoans)
          .set({ dueOn: input.dueOn, note: input.note ?? loan.note })
          .where(eq(libraryLoans.id, loan.id));
        await logEvent(tx, {
          actorId: ctx.session.user.id,
          bookId: book.id,
          details: {
            dueOn: input.dueOn,
            from: loan.dueOn,
            ...(input.note ? { note: input.note } : {}),
          },
          loanId: loan.id,
          subjectId: loan.userId,
          type: "extended",
        });
        return { dueOn: input.dueOn };
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
