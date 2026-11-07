import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import {
  libraryBooks,
  libraryEvents,
  libraryLoans,
  libraryReservations,
} from "~/lib/db/schema/schema";
import {
  type BookState,
  type BookStatus,
  bookState,
  borrowRefusal,
  dueOnFrom,
  type LibraryEventType,
  type OpenLoan,
  type ReservationLine,
  type ReservationStatus,
  settleQueue,
} from "~/lib/library";
import { localDay } from "~/lib/schedule-team";
import { db } from "~/server";
import { type ReadyNotice, sendReadyEmails } from "~/server/library-email";

type Db = typeof db;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Executor = Db | Tx;

/** Today in Aachen, as `yyyy-MM-dd`. */
export const libraryToday = () => localDay(new Date());

/** Each book's open loan and active queue, keyed by book id. */
export async function loadLending(executor: Executor, bookIds: number[]) {
  const loans = new Map<number, OpenLoan>();
  const lines = new Map<number, ReservationLine[]>();
  if (bookIds.length === 0) {
    return { lines, loans };
  }
  const [openLoans, reservations] = await Promise.all([
    executor
      .select({
        bookId: libraryLoans.bookId,
        dueOn: libraryLoans.dueOn,
        userId: libraryLoans.userId,
      })
      .from(libraryLoans)
      .where(
        and(
          inArray(libraryLoans.bookId, bookIds),
          isNull(libraryLoans.returnedAt)
        )
      ),
    executor
      .select({
        bookId: libraryReservations.bookId,
        createdAt: libraryReservations.createdAt,
        expiresOn: libraryReservations.expiresOn,
        id: libraryReservations.id,
        status: libraryReservations.status,
        userId: libraryReservations.userId,
      })
      .from(libraryReservations)
      .where(
        and(
          inArray(libraryReservations.bookId, bookIds),
          inArray(libraryReservations.status, ["waiting", "ready"])
        )
      ),
  ]);
  for (const { bookId, ...loan } of openLoans) {
    loans.set(bookId, loan);
  }
  for (const { bookId, status, ...reservation } of reservations) {
    const line = lines.get(bookId) ?? [];
    line.push({ ...reservation, status: status as ReservationStatus });
    lines.set(bookId, line);
  }
  return { lines, loans };
}

/** Every given book's derived state on `today`. */
export async function statesOf(
  executor: Executor,
  books: readonly { id: number; status: string }[],
  today = libraryToday()
) {
  const { lines, loans } = await loadLending(
    executor,
    books.map((book) => book.id)
  );
  return new Map<number, BookState>(
    books.map((book) => [
      book.id,
      bookState(
        { status: book.status as BookStatus },
        loans.get(book.id),
        lines.get(book.id) ?? [],
        today
      ),
    ])
  );
}

/**
 * Locks a book's row for the rest of the transaction (every library write
 * runs under it, like `takeSlot`), or answers NOT_FOUND.
 */
export async function lockBook(tx: Tx, id: number) {
  const [book] = await tx
    .select()
    .from(libraryBooks)
    .where(eq(libraryBooks.id, id))
    .for("update");
  if (!book) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Book not found." });
  }
  return book;
}

/** Writes the cached `status` from the book's derived state. */
export async function refreshStatus(
  tx: Tx,
  book: { id: number; status: string }
) {
  const state = (await statesOf(tx, [book])).get(book.id);
  const status = state?.kind ?? (book.status as BookStatus);
  if (status !== book.status) {
    await tx
      .update(libraryBooks)
      .set({ status })
      .where(eq(libraryBooks.id, book.id));
  }
  return status;
}

/** Appends one line to a book's history. */
export const logEvent = (
  tx: Tx,
  event: {
    /** Null when nobody did it, e.g. a hold that ran out. */
    actorId: string | null;
    bookId: number;
    details?: Record<string, unknown>;
    loanId?: number;
    subjectId?: string | null;
    type: LibraryEventType;
  }
) =>
  tx.insert(libraryEvents).values({
    actorId: event.actorId,
    bookId: event.bookId,
    details: event.details ?? {},
    loanId: event.loanId ?? null,
    subjectId: event.subjectId ?? null,
    type: event.type,
  });

/** The book's open loan, read after `lockBook` so nobody changes it meanwhile. */
export async function openLoanOf(tx: Tx, bookId: number) {
  const [loan] = await tx
    .select()
    .from(libraryLoans)
    .where(
      and(eq(libraryLoans.bookId, bookId), isNull(libraryLoans.returnedAt))
    );
  return loan ?? null;
}

/**
 * Writes what the book's queue needs on `today` (`settleQueue`): a hold that
 * ran out expires and the next in line gets theirs; then refreshes `status`.
 * Runs under the book's row lock, in every library write and before reads.
 * Returns the holds that started, to email once the transaction commits.
 */
export async function settleBook(
  tx: Tx,
  book: { id: number; status: string; title: string },
  today = libraryToday()
): Promise<ReadyNotice[]> {
  if (book.status === "offered" || book.status === "withdrawn") {
    return [];
  }
  if (await openLoanOf(tx, book.id)) {
    return [];
  }
  const { lines } = await loadLending(tx, [book.id]);
  const line = lines.get(book.id) ?? [];
  const plan = settleQueue(line, today);
  for (const id of plan.expire) {
    const reservation = line.find((entry) => entry.id === id);
    // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
    await tx
      .update(libraryReservations)
      .set({ status: "expired" })
      .where(eq(libraryReservations.id, id));
    await logEvent(tx, {
      actorId: null,
      bookId: book.id,
      details: { expiresOn: reservation?.expiresOn ?? null },
      subjectId: reservation?.userId ?? null,
      type: "expired",
    });
  }
  const notices: ReadyNotice[] = [];
  if (plan.ready) {
    await tx
      .update(libraryReservations)
      .set({
        expiresOn: plan.ready.expiresOn,
        readyAt: new Date(),
        status: "ready",
      })
      .where(eq(libraryReservations.id, plan.ready.id));
    await logEvent(tx, {
      actorId: null,
      bookId: book.id,
      details: { expiresOn: plan.ready.expiresOn },
      subjectId: plan.ready.userId,
      type: "ready",
    });
    notices.push({
      expiresOn: plan.ready.expiresOn,
      reservationId: plan.ready.id,
      title: book.title,
      userId: plan.ready.userId,
    });
  }
  await refreshStatus(tx, book);
  return notices;
}

/**
 * Runs a library write in one transaction and, once it has committed, sends
 * the ready emails it collected. An email never undoes the write.
 */
export async function withReadyEmails<T>(
  write: (tx: Tx, notices: ReadyNotice[]) => Promise<T>
): Promise<T> {
  const notices: ReadyNotice[] = [];
  const result = await db.transaction((tx) => write(tx, notices));
  await sendReadyEmails(notices);
  return result;
}

/** Locks a book and settles its queue, collecting any hold that started. */
export async function lockAndSettle(
  tx: Tx,
  id: number,
  notices: ReadyNotice[]
) {
  const book = await lockBook(tx, id);
  notices.push(...(await settleBook(tx, book)));
  const [fresh] = await tx
    .select()
    .from(libraryBooks)
    .where(eq(libraryBooks.id, id));
  return fresh ?? book;
}

/**
 * Before a read: settles every book whose hold ran out, each under its own
 * row lock, so the list shows and stores the next person's turn. No job runs
 * this on a schedule; the next visitor does.
 */
export async function settleRunOutHolds(today = libraryToday()) {
  const due = await db
    .selectDistinct({ bookId: libraryReservations.bookId })
    .from(libraryReservations)
    .where(
      and(
        eq(libraryReservations.status, "ready"),
        lt(libraryReservations.expiresOn, today)
      )
    );
  for (const { bookId } of due) {
    // biome-ignore lint/performance/noAwaitInLoops: one book at a time, each under its own lock.
    await withReadyEmails(async (tx, notices) => {
      const book = await lockBook(tx, bookId);
      notices.push(...(await settleBook(tx, book, today)));
    });
  }
}

/**
 * Starts a loan for `userId`, due `LOAN_DAYS` from today in Aachen, after
 * checking under the book's row lock that it's on the shelf and free, or
 * held for them (which fulfils their reservation). Used by a member's Borrow
 * and the librarian's Lend by hand (`byHand`).
 */
export async function startLoan(
  tx: Tx,
  {
    actorId,
    bookId,
    byHand = false,
    userId,
  }: { actorId: string; bookId: number; byHand?: boolean; userId: string },
  notices: ReadyNotice[] = []
) {
  const settled: ReadyNotice[] = [];
  const book = await lockAndSettle(tx, bookId, settled);
  // Nobody needs an email about the book they're taking now.
  notices.push(...settled.filter((notice) => notice.userId !== userId));
  const today = libraryToday();
  const state = (await statesOf(tx, [book], today)).get(book.id);
  const refusal = state ? borrowRefusal(state, userId) : null;
  if (refusal) {
    throw new TRPCError({ code: "CONFLICT", message: refusal });
  }
  const dueOn = dueOnFrom(today);
  const [loan] = await tx
    .insert(libraryLoans)
    .values({ bookId: book.id, dueOn, userId })
    .returning({ id: libraryLoans.id });
  if (!loan) {
    throw new Error("Failed to start the loan");
  }
  if (state?.kind === "reserved") {
    const [fulfilled] = await tx
      .update(libraryReservations)
      .set({ status: "fulfilled" })
      .where(
        and(
          eq(libraryReservations.bookId, book.id),
          eq(libraryReservations.userId, userId),
          eq(libraryReservations.status, "ready")
        )
      )
      .returning({ id: libraryReservations.id });
    if (fulfilled) {
      await logEvent(tx, {
        actorId,
        bookId: book.id,
        subjectId: userId,
        type: "fulfilled",
      });
    }
  }
  await refreshStatus(tx, book);
  await logEvent(tx, {
    actorId,
    bookId: book.id,
    details: byHand ? { byHand, dueOn } : { dueOn },
    loanId: loan.id,
    subjectId: userId,
    type: "borrowed",
  });
  return { dueOn, loanId: loan.id };
}
