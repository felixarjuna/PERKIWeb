import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import {
  libraryBooks,
  libraryEvents,
  libraryLoans,
  libraryReservations,
  users,
} from "~/lib/db/schema/schema";
import {
  type BookState,
  extendedDueOn,
  extendRefusal,
  inShelfState,
  isOverdue,
  joinRefusal,
  LIBRARY_SHOWS,
  LIBRARY_SORTS,
  MAX_AUTHOR,
  MAX_DESCRIPTION,
  MAX_LANGUAGE,
  MAX_LOAN_NOTE,
  MAX_TITLE,
  memberBookState,
  queueOrder,
  queuePosition,
  SHELF_STATES,
  shownFor,
  sortBooks,
} from "~/lib/library";
import { db } from "~/server";
import {
  libraryToday,
  loadLending,
  lockAndSettle,
  lockBook,
  logEvent,
  openLoanOf,
  refreshStatus,
  settleBook,
  settleRunOutHolds,
  startLoan,
  statesOf,
  withReadyEmails,
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

/** What a member types when offering a book of their own. */
const offerInput = z.object({
  author: z.string().trim().min(1, "Add the author.").max(MAX_AUTHOR),
  description: optionalText(MAX_DESCRIPTION),
  language: optionalText(MAX_LANGUAGE),
  title: z.string().trim().min(1, "Add the title.").max(MAX_TITLE),
});

const bookInput = offerInput.extend({
  /** The member who lends it; null when PERKI owns it. */
  ownerId: z.string().min(1).nullable(),
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

const notInLine = () =>
  new TRPCError({
    code: "BAD_REQUEST",
    message: "You're not in line for this book.",
  });

/** Every book's waiting/ready queue and derived state. */
async function lendingOf(books: readonly { id: number; status: string }[]) {
  const [{ lines }, states] = await Promise.all([
    loadLending(
      db,
      books.map((book) => book.id)
    ),
    statesOf(db, books),
  ]);
  return { lines, states };
}

export const libraryRouter = createTRPCRouter({
  /** Staff, once an offered book is in their hands: puts it on the shelf. */
  accept: adminProcedure.input(bookId).mutation(({ ctx, input }) =>
    db.transaction(async (tx) => {
      const book = await lockBook(tx, input.id);
      if (book.status !== "offered") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This book is already on the shelf.",
        });
      }
      await tx
        .update(libraryBooks)
        .set({ acceptedAt: new Date(), status: "available" })
        .where(eq(libraryBooks.id, book.id));
      await logEvent(tx, {
        actorId: ctx.session.user.id,
        bookId: book.id,
        subjectId: book.ownerId,
        type: "accepted",
      });
      return { id: book.id };
    })
  ),

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
    withReadyEmails((tx, notices) =>
      startLoan(
        tx,
        {
          actorId: ctx.session.user.id,
          bookId: input.id,
          userId: ctx.session.user.id,
        },
        notices
      )
    ).catch(loanFailed)
  ),

  /**
   * Staff: cancels a member's place in line. A cancelled hold passes to the
   * next in line at once.
   */
  cancelReservation: adminProcedure
    .input(z.object({ reservationId: z.number().int().positive() }))
    .mutation(({ ctx, input }) =>
      withReadyEmails(async (tx, notices) => {
        const [found] = await tx
          .select({ bookId: libraryReservations.bookId })
          .from(libraryReservations)
          .where(eq(libraryReservations.id, input.reservationId));
        if (!found) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Reservation not found.",
          });
        }
        const book = await lockBook(tx, found.bookId);
        const [cancelled] = await tx
          .update(libraryReservations)
          .set({ status: "cancelled" })
          .where(
            and(
              eq(libraryReservations.id, input.reservationId),
              inArray(libraryReservations.status, ["waiting", "ready"])
            )
          )
          .returning({ userId: libraryReservations.userId });
        if (!cancelled) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This reservation has already ended.",
          });
        }
        await logEvent(tx, {
          actorId: ctx.session.user.id,
          bookId: book.id,
          subjectId: cancelled.userId,
          type: "cancelled",
        });
        notices.push(...(await settleBook(tx, book)));
        return { id: input.reservationId };
      })
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
      await settleRunOutHolds();
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
      const { lines } = await loadLending(db, [book.id]);
      const line = queueOrder(lines.get(book.id) ?? []);
      const people = await peopleById([
        ...events.flatMap((event) => [event.actorId, event.subjectId]),
        ...line.map((reservation) => reservation.userId),
      ]);
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
        /** Who's in line, the one whose turn it is first. */
        queue: line.map((reservation) => ({
          expiresOn: reservation.expiresOn,
          id: reservation.id,
          name: nameOf(reservation.userId) ?? "Removed account",
          position: queuePosition(line, reservation.userId),
          status: reservation.status,
        })),
        title: book.title,
      };
    }),

  /**
   * Signed-in members: a place in line for a book someone else has. Returns
   * their place; they borrow it once the librarian has it back.
   */
  joinQueue: protectedProcedure.input(bookId).mutation(({ ctx, input }) =>
    withReadyEmails(async (tx, notices) => {
      const viewerId = ctx.session.user.id;
      const book = await lockAndSettle(tx, input.id, notices);
      const { lines } = await loadLending(tx, [book.id]);
      const line = lines.get(book.id) ?? [];
      const state = (await statesOf(tx, [book])).get(book.id);
      const inLine = line.some((entry) => entry.userId === viewerId);
      const refusal = state ? joinRefusal(state, viewerId, inLine) : null;
      if (refusal) {
        throw new TRPCError({ code: "BAD_REQUEST", message: refusal });
      }
      const [reservation] = await tx
        .insert(libraryReservations)
        .values({ bookId: book.id, userId: viewerId })
        .returning();
      if (!reservation) {
        throw new Error("Failed to join the queue");
      }
      await logEvent(tx, {
        actorId: viewerId,
        bookId: book.id,
        subjectId: viewerId,
        type: "queued",
      });
      return {
        position: queuePosition(
          [...line, { ...reservation, status: "waiting" as const }],
          viewerId
        ),
      };
    })
  ),

  /**
   * Signed-in members: gives up their place in line, or the hold that's
   * theirs, which then passes to the next in line.
   */
  leaveQueue: protectedProcedure.input(bookId).mutation(({ ctx, input }) =>
    withReadyEmails(async (tx, notices) => {
      const viewerId = ctx.session.user.id;
      const book = await lockAndSettle(tx, input.id, notices);
      const [left] = await tx
        .update(libraryReservations)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(libraryReservations.bookId, book.id),
            eq(libraryReservations.userId, viewerId),
            inArray(libraryReservations.status, ["waiting", "ready"])
          )
        )
        .returning({ id: libraryReservations.id });
      if (!left) {
        throw notInLine();
      }
      await logEvent(tx, {
        actorId: viewerId,
        bookId: book.id,
        subjectId: viewerId,
        type: "left_queue",
      });
      notices.push(...(await settleBook(tx, book)));
      return { id: book.id };
    })
  ),

  /** Staff: lends a book to a named member, e.g. one without a phone at hand. */
  lend: adminProcedure
    .input(bookId.extend({ userId: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      withReadyEmails((tx, notices) =>
        startLoan(
          tx,
          {
            actorId: ctx.session.user.id,
            bookId: input.id,
            byHand: true,
            userId: input.userId,
          },
          notices
        )
      ).catch(loanFailed)
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
      await settleRunOutHolds();
      const books = await db
        .select({
          addedAt: libraryBooks.createdAt,
          author: libraryBooks.author,
          description: libraryBooks.description,
          id: libraryBooks.id,
          language: libraryBooks.language,
          ownerId: libraryBooks.ownerId,
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
      const { lines, states } = await lendingOf(books);
      const viewerId = ctx.session.user.id;
      const items = books
        .map(({ ownerId, status: _status, ...book }) => {
          const state = memberBookState(
            states.get(book.id) ?? { kind: "available", queue: 0 },
            viewerId,
            queuePosition(lines.get(book.id) ?? [], viewerId)
          );
          // An offered book is "mine" to the member who offered it, never
          // naming the owner to anyone else.
          return {
            ...book,
            state:
              state.kind === "offered"
                ? { ...state, mine: ownerId === viewerId }
                : state,
          };
        })
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
      await settleRunOutHolds();
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
    withReadyEmails(async (tx, notices) => {
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
      await logEvent(tx, {
        actorId,
        bookId: book.id,
        details: { dueOn: loan.dueOn },
        loanId: loan.id,
        subjectId: loan.userId,
        type: "returned",
      });
      // The first in line's 7 days start today.
      notices.push(...(await settleBook(tx, book)));
      const status = await refreshStatus(tx, book);
      return { id: book.id, status };
    })
  ),

  /**
   * Signed-in members: the books they hold, each with its due date and
   * whether they may extend it, and the ones they've given back.
   */
  mine: protectedProcedure.query(async ({ ctx }) => {
    await settleRunOutHolds();
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
    const waitingFor = await db
      .select({
        author: libraryBooks.author,
        bookId: libraryReservations.bookId,
        title: libraryBooks.title,
      })
      .from(libraryReservations)
      .innerJoin(libraryBooks, eq(libraryBooks.id, libraryReservations.bookId))
      .where(
        and(
          eq(libraryReservations.userId, viewerId),
          inArray(libraryReservations.status, ["waiting", "ready"]),
          ne(libraryBooks.status, "withdrawn")
        )
      )
      .orderBy(asc(libraryReservations.createdAt));
    const { lines } = await loadLending(db, [
      ...open.map((loan) => loan.bookId),
      ...waitingFor.map((entry) => entry.bookId),
    ]);
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
      /** Books they wait for: their place, or until when it's held for them. */
      queue: waitingFor.map((entry) => {
        const line = queueOrder(lines.get(entry.bookId) ?? []);
        const [turn] = line;
        const ready = turn?.status === "ready" && turn.userId === viewerId;
        return {
          ...entry,
          holdEndsOn: ready ? (turn.expiresOn ?? null) : null,
          position: ready ? null : queuePosition(line, viewerId),
        };
      }),
    };
  }),

  /**
   * Signed-in members: the books they lend to the library, each with who
   * has it now and until when, and who borrowed it before. Only the owner
   * sees these holders; the general list never does.
   */
  myLentBooks: protectedProcedure.query(async ({ ctx }) => {
    await settleRunOutHolds();
    const books = await db
      .select()
      .from(libraryBooks)
      .where(eq(libraryBooks.ownerId, ctx.session.user.id))
      .orderBy(asc(libraryBooks.title), asc(libraryBooks.id));
    if (books.length === 0) {
      return [];
    }
    const states = await statesOf(db, books);
    const loans = await db
      .select({
        bookId: libraryLoans.bookId,
        borrowedAt: libraryLoans.borrowedAt,
        returnedAt: libraryLoans.returnedAt,
        userId: libraryLoans.userId,
      })
      .from(libraryLoans)
      .where(
        inArray(
          libraryLoans.bookId,
          books.map((book) => book.id)
        )
      )
      .orderBy(desc(libraryLoans.borrowedAt), desc(libraryLoans.id));
    const people = await peopleById(loans.map((loan) => loan.userId));
    const nameOf = (id: string) => people.get(id)?.name ?? "Removed account";
    return books.map((book) => {
      const state = states.get(book.id) ?? { kind: "available", queue: 0 };
      return {
        author: book.author,
        dueOn: state.kind === "borrowed" ? state.dueOn : null,
        holder: state.kind === "borrowed" ? nameOf(state.holderId) : null,
        id: book.id,
        kind: state.kind,
        loans: loans
          .filter((loan) => loan.bookId === book.id)
          .map((loan) => ({
            borrowedAt: loan.borrowedAt,
            borrower: nameOf(loan.userId),
            returnedAt: loan.returnedAt,
          })),
        overdue: state.kind === "borrowed" && state.overdue,
        title: book.title,
      };
    });
  }),

  /**
   * Signed-in members: offers a book of their own to the library. It stays
   * theirs and is listed as Offered until the librarian accepts it.
   */
  offer: protectedProcedure.input(offerInput).mutation(({ ctx, input }) =>
    db.transaction(async (tx) => {
      const viewerId = ctx.session.user.id;
      const [book] = await tx
        .insert(libraryBooks)
        .values({
          ...input,
          createdById: viewerId,
          ownerId: viewerId,
          status: "offered",
        })
        .returning({ id: libraryBooks.id });
      if (!book) {
        throw new Error("Failed to offer the book");
      }
      await logEvent(tx, {
        actorId: viewerId,
        bookId: book.id,
        details: { author: input.author, title: input.title },
        subjectId: viewerId,
        type: "offered",
      });
      return book;
    })
  ),

  /** Staff: brings a withdrawn book back onto the shelf. */
  restore: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) =>
      withReadyEmails(async (tx, notices) => {
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
        await logEvent(tx, {
          actorId: ctx.session.user.id,
          bookId: book.id,
          type: "restored",
        });
        const status = await refreshStatus(tx, {
          id: book.id,
          status: "available",
        });
        notices.push(...(await settleBook(tx, { ...book, status })));
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
        const actorId = ctx.session.user.id;
        await logEvent(tx, { actorId, bookId: book.id, type: "withdrawn" });
        // Nobody can wait for a book that left the library.
        const cancelled = await tx
          .update(libraryReservations)
          .set({ status: "cancelled" })
          .where(
            and(
              eq(libraryReservations.bookId, book.id),
              inArray(libraryReservations.status, ["waiting", "ready"])
            )
          )
          .returning({ userId: libraryReservations.userId });
        for (const { userId } of cancelled) {
          // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
          await logEvent(tx, {
            actorId,
            bookId: book.id,
            subjectId: userId,
            type: "cancelled",
          });
        }
        return { id: book.id };
      })
    ),
});
