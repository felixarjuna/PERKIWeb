import { and, eq, isNull, sql } from "drizzle-orm";
import { libraryHistory, libraryLoans } from "~/lib/db/schema/schema";
import {
  type CurrentLoan,
  type ImportedLoan,
  type PlannedLoan,
  sheetLoanEvents,
} from "~/lib/library-import";
import type { db } from "~/server";
import { lockBook, logEvent, refreshStatus } from "~/server/library";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | Tx;

const ref = (bookId: number) => `id:${bookId}`;

/**
 * What the library already holds from earlier imports (#149): the loans taken
 * from the lending history (their "borrowed" line says `source: "sheet"` and
 * `precision: "month"`), and each book's open loan, marked when an import
 * started it today from "Lent to" (`source: "sheet"` without a month).
 */
export async function loadSheetLoans(executor: Executor): Promise<{
  current: CurrentLoan[];
  imported: ImportedLoan[];
}> {
  const [borrowed, open] = await Promise.all([
    executor
      .select({
        bookId: libraryLoans.bookId,
        borrowerId: libraryLoans.borrowerId,
        details: libraryHistory.details,
        loanId: libraryLoans.id,
      })
      .from(libraryHistory)
      .innerJoin(libraryLoans, eq(libraryHistory.loanId, libraryLoans.id))
      .where(
        and(
          eq(libraryHistory.type, "borrowed"),
          sql`${libraryHistory.details}->>'source' = 'sheet'`
        )
      ),
    executor
      .select({
        bookId: libraryLoans.bookId,
        borrowerId: libraryLoans.borrowerId,
        id: libraryLoans.id,
      })
      .from(libraryLoans)
      .where(isNull(libraryLoans.returnedAt)),
  ]);
  const imported: ImportedLoan[] = [];
  const fromLentTo = new Set<number>();
  for (const line of borrowed) {
    const { month, precision } = line.details;
    if (precision === "month" && typeof month === "string") {
      imported.push({
        borrowerId: line.borrowerId,
        month,
        ref: ref(line.bookId),
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
  };
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
