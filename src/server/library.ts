import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import {
  libraryBooks,
  libraryHistory,
  libraryLoans,
  libraryQueue,
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
} from "~/lib/library";
import { localDay } from "~/lib/schedule-team";
import type { db } from "~/server";

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
        userId: libraryLoans.borrowerId,
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
        bookId: libraryQueue.bookId,
        createdAt: libraryQueue.createdAt,
        expiresOn: libraryQueue.expiresOn,
        id: libraryQueue.id,
        status: libraryQueue.status,
        userId: libraryQueue.userId,
      })
      .from(libraryQueue)
      .where(
        and(
          inArray(libraryQueue.bookId, bookIds),
          inArray(libraryQueue.status, ["waiting", "ready"])
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
    actorId: string;
    bookId: number;
    details?: Record<string, unknown>;
    loanId?: number;
    subjectId?: string | null;
    type: LibraryEventType;
  }
) =>
  tx.insert(libraryHistory).values({
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
 * Starts a loan for `userId`, due `LOAN_DAYS` from today in Aachen, after
 * checking under the book's row lock that it's on the shelf and free. Used
 * by a member's Borrow and the librarian's Lend by hand (`byHand`).
 */
export async function startLoan(
  tx: Tx,
  {
    actorId,
    bookId,
    byHand = false,
    userId,
  }: { actorId: string; bookId: number; byHand?: boolean; userId: string }
) {
  const book = await lockBook(tx, bookId);
  const today = libraryToday();
  const state = (await statesOf(tx, [book], today)).get(book.id);
  const refusal = state ? borrowRefusal(state) : null;
  if (refusal) {
    throw new TRPCError({ code: "CONFLICT", message: refusal });
  }
  const dueOn = dueOnFrom(today);
  const [loan] = await tx
    .insert(libraryLoans)
    .values({ bookId: book.id, borrowerId: userId, dueOn })
    .returning({ id: libraryLoans.id });
  if (!loan) {
    throw new Error("Failed to start the loan");
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
