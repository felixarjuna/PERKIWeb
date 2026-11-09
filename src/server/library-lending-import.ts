import { and, count, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  libraryHistory,
  libraryLoans,
  libraryQueue,
} from "~/lib/db/schema/schema";
import {
  type CurrentLoan,
  type ImportedLoan,
  type LoanUpdate,
  loanUpdateEvents,
  type PlannedLoan,
  sheetLoanEvents,
} from "~/lib/library-import";
import type { db } from "~/server";
import {
  lockBook,
  logEvent,
  refreshStatus,
  settleBook,
} from "~/server/library";
import type { ReadyNotice } from "~/server/library-email";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | Tx;

const ref = (bookId: number) => `id:${bookId}`;

const fromSheet = sql`${libraryHistory.details}->>'source' = 'sheet'`;

/**
 * What the library already holds from earlier imports (#149): the loans taken
 * from the lending history (their "borrowed" line says `source: "sheet"` and
 * `precision: "month"`, the one marker of a sheet loan) with how many
 * `extended` lines the sheet gave each, each book's open loan, marked when an
 * import started it today from "Lent to" (`source: "sheet"` without a month),
 * and the books someone waits for.
 */
export async function loadSheetLoans(executor: Executor): Promise<{
  current: CurrentLoan[];
  imported: ImportedLoan[];
  reserved: string[];
}> {
  const [borrowed, extended, open, queued] = await Promise.all([
    executor
      .select({
        bookId: libraryLoans.bookId,
        borrowerId: libraryLoans.borrowerId,
        details: libraryHistory.details,
        dueOn: libraryLoans.dueOn,
        extensions: libraryLoans.extensions,
        loanId: libraryLoans.id,
        returnedAt: libraryLoans.returnedAt,
        returnedById: libraryLoans.returnedById,
      })
      .from(libraryHistory)
      .innerJoin(libraryLoans, eq(libraryHistory.loanId, libraryLoans.id))
      .where(and(eq(libraryHistory.type, "borrowed"), fromSheet)),
    executor
      .select({ count: count(), loanId: libraryHistory.loanId })
      .from(libraryHistory)
      .where(and(eq(libraryHistory.type, "extended"), fromSheet))
      .groupBy(libraryHistory.loanId),
    executor
      .select({
        bookId: libraryLoans.bookId,
        borrowerId: libraryLoans.borrowerId,
        id: libraryLoans.id,
      })
      .from(libraryLoans)
      .where(isNull(libraryLoans.returnedAt)),
    executor
      .selectDistinct({ bookId: libraryQueue.bookId })
      .from(libraryQueue)
      .where(inArray(libraryQueue.status, ["waiting", "ready"])),
  ]);
  const extensionsOf = new Map(
    extended.map((row) => [row.loanId, Number(row.count)])
  );
  const imported: ImportedLoan[] = [];
  const fromLentTo = new Set<number>();
  for (const line of borrowed) {
    const { month, precision } = line.details;
    if (precision === "month" && typeof month === "string") {
      imported.push({
        borrowerId: line.borrowerId,
        dueOn: line.dueOn,
        extensions: line.extensions,
        loanId: line.loanId,
        month,
        ref: ref(line.bookId),
        returnedAt: line.returnedAt,
        returnedById: line.returnedById,
        sheetExtensions: extensionsOf.get(line.loanId) ?? 0,
      });
    } else {
      fromLentTo.add(line.loanId);
    }
  }
  return {
    current: open.map((loan) => ({
      borrowerId: loan.borrowerId,
      fromLentTo: fromLentTo.has(loan.id),
      loanId: loan.id,
      ref: ref(loan.bookId),
    })),
    imported,
    reserved: queued.map((row) => ref(row.bookId)),
  };
}

/**
 * Brings one loan an earlier import wrote up to date (`LoanUpdate`): its due
 * date, extensions and whether it's out, with one month-precision line per
 * added extension. Reopening drops the import's own guessed "returned" line;
 * a loan that stays returned has that line moved to its new date. Settles the
 * book's queue under its row lock, collecting any hold that starts.
 */
export async function writeLoanUpdate(
  tx: Tx,
  {
    actorId,
    bookId,
    update,
  }: { actorId: string; bookId: number; update: LoanUpdate },
  notices: ReadyNotice[]
) {
  const book = await lockBook(tx, bookId);
  await tx
    .update(libraryLoans)
    .set({
      dueOn: update.dueOn,
      extensions: update.extensions,
      returnedAt: update.returnedAt,
    })
    .where(eq(libraryLoans.id, update.loanId));
  const { added, moveReturn } = loanUpdateEvents(update);
  const importReturn = and(
    eq(libraryHistory.loanId, update.loanId),
    eq(libraryHistory.type, "returned"),
    fromSheet
  );
  if (update.action === "reopen") {
    await tx.delete(libraryHistory).where(importReturn);
  }
  if (moveReturn) {
    await tx
      .update(libraryHistory)
      .set({ at: moveReturn.at, details: moveReturn.details })
      .where(importReturn);
  }
  for (const event of added) {
    // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
    await logEvent(tx, {
      actorId,
      at: event.at,
      bookId,
      details: event.details,
      loanId: update.loanId,
      subjectId: update.borrowerId,
      type: event.type,
    });
  }
  notices.push(...(await settleBook(tx, book)).notices);
}

/**
 * Writes one loan from the lending history with its history lines, dated as
 * the sheet's months say. A loan an earlier import started today from "Lent
 * to" is moved to its real start instead of adding a second one. Refreshes
 * the book's cached status under its row lock.
 */
export async function writeSheetLoan(
  tx: Tx,
  {
    actorId,
    bookId,
    loan,
  }: { actorId: string; bookId: number; loan: PlannedLoan }
) {
  const book = await lockBook(tx, bookId);
  const values = {
    borrowedAt: loan.borrowedAt,
    dueOn: loan.dueOn,
    extensions: loan.extended.length,
    returnedAt: loan.returnedAt,
  };
  const [borrowed, ...rest] = sheetLoanEvents(loan);
  let loanId = loan.replacesLoanId;
  if (loanId) {
    await tx
      .update(libraryLoans)
      .set(values)
      .where(eq(libraryLoans.id, loanId));
    // The "borrowed" line said today; it now says the month it really began.
    await tx
      .update(libraryHistory)
      .set({ at: borrowed?.at, details: borrowed?.details })
      .where(
        and(
          eq(libraryHistory.loanId, loanId),
          eq(libraryHistory.type, "borrowed")
        )
      );
  } else {
    const [inserted] = await tx
      .insert(libraryLoans)
      .values({ ...values, bookId, borrowerId: loan.borrowerId })
      .returning({ id: libraryLoans.id });
    if (!(inserted && borrowed)) {
      throw new Error("Failed to add the loan");
    }
    loanId = inserted.id;
    rest.unshift(borrowed);
  }
  for (const event of rest) {
    // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
    await logEvent(tx, {
      actorId,
      at: event.at,
      bookId,
      details: event.details,
      loanId,
      subjectId: loan.borrowerId,
      type: event.type,
    });
  }
  await refreshStatus(tx, book);
}
