import { TRPCError } from "@trpc/server";
import { eq, inArray, sql } from "drizzle-orm";
import {
  libraryBooks,
  libraryLoans,
  libraryQueue,
  users,
} from "~/lib/db/schema/schema";
import {
  LENDING_TAB,
  type LendingSheet,
  type LibrarySheet,
  type LoanUpdate,
  type PlannedLoan,
  parseLendingSheet,
  parseLibrarySheet,
  planLendingHistory,
  planLibraryImport,
  type StoredBook,
  withoutCoveredLoans,
} from "~/lib/library-import";
import { suggestAccount } from "~/lib/people";
import { localDay } from "~/lib/schedule-team";
import { sheetUrl } from "~/lib/settings";
import { db } from "~/server";
import { sheetTabs, sheetTitle, sheetValues } from "~/server/google-sheets";
import { logEvent, startLoan } from "~/server/library";
import { type ReadyNotice, sendReadyEmailsLater } from "~/server/library-email";
import {
  loadSheetLoans,
  writeLoanUpdate,
  writeSheetLoan,
} from "~/server/library-lending-import";
import { resolveAccounts } from "~/server/people";
import { librarySheetId } from "~/server/settings";
import { adminProcedure, createTRPCRouter } from "../trpc";

type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

const noSheet = () =>
  new TRPCError({
    code: "PRECONDITION_FAILED",
    message: "No library sheet is set. Paste its link first.",
  });

/** Calls Google and turns its failures into one readable error. */
const fromGoogle = <T>(request: () => Promise<T>): Promise<T> =>
  request().catch((error: unknown) => {
    throw new TRPCError({
      cause: error,
      code: "BAD_GATEWAY",
      message: "The library sheet couldn't be read from Google. Try again.",
    });
  });

interface Sheet {
  books: LibrarySheet;
  lending: LendingSheet;
}

/** The book list (the sheet's first tab) and its lending history ("Peminjaman"). */
async function readSheet(): Promise<Sheet> {
  const sheetId = await librarySheetId();
  if (!sheetId) {
    throw noSheet();
  }
  const tabs = await fromGoogle(() => sheetTabs(sheetId));
  const [first] = tabs;
  const lendingTab = tabs.find(
    (title) => title.trim().toLowerCase() === LENDING_TAB
  );
  const read = (tab: string | undefined) =>
    tab ? fromGoogle(() => sheetValues(sheetId, tab)) : Promise.resolve([]);
  const [books, lending] = await Promise.all([
    read(first === lendingTab ? undefined : first),
    read(lendingTab),
  ]);
  return {
    books: parseLibrarySheet(books),
    lending: parseLendingSheet(lending),
  };
}

/**
 * Every book the import compares with. A book is `lendable` when it was never
 * lent, nobody waits for it and it's on the shelf, so a "Lent to" linked late
 * still starts its loan once, and never again after it's returned.
 */
async function loadStored(executor: Executor): Promise<StoredBook[]> {
  const [books, lent, queued] = await Promise.all([
    executor.select().from(libraryBooks),
    executor.selectDistinct({ bookId: libraryLoans.bookId }).from(libraryLoans),
    executor
      .selectDistinct({ bookId: libraryQueue.bookId })
      .from(libraryQueue)
      .where(inArray(libraryQueue.status, ["waiting", "ready"])),
  ]);
  const busy = new Set([...lent, ...queued].map((row) => row.bookId));
  return books.map((book) => ({
    author: book.author,
    category: book.category,
    description: book.description,
    format: book.format,
    id: book.id,
    language: book.language,
    lendable:
      book.format === "physical" &&
      book.status === "available" &&
      !busy.has(book.id),
    ownerId: book.ownerId,
    publisher: book.publisher,
    title: book.title,
  }));
}

/**
 * Plans the book list, then the lending history on the copies it places. A
 * "Lent to" whose loan the history knows no longer starts one today.
 */
async function planWith(executor: Executor, sheet: Sheet) {
  const names = [
    ...sheet.books.copies.flatMap((copy) => [copy.owner, copy.lentTo]),
    ...sheet.lending.rows.flatMap((row) => [row.owner, row.borrower]),
  ].filter((name): name is string => Boolean(name));
  const [accountFor, stored, held] = await Promise.all([
    // A savepoint inside `run`'s transaction, a short transaction otherwise.
    executor.transaction((tx) => resolveAccounts(tx, names)),
    loadStored(executor),
    loadSheetLoans(executor),
  ]);
  const books = planLibraryImport({ accountFor, sheet: sheet.books, stored });
  const lending = planLendingHistory({
    accountFor,
    current: held.current,
    imported: held.imported,
    now: new Date(),
    placed: books.placed,
    reserved: held.reserved,
    sheet: sheet.lending,
    unmatched: books.unmatched,
  });
  return { books: withoutCoveredLoans(books, lending), lending };
}

type Plan = Awaited<ReturnType<typeof planWith>>;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Adds a new copy from the book list and its "added" line; returns its id. */
async function addBook(
  tx: Tx,
  actorId: string,
  { copy, ownerId }: Plan["books"]["added"][number]
) {
  const [book] = await tx
    .insert(libraryBooks)
    .values({
      acceptedAt: new Date(),
      author: copy.author,
      category: copy.category,
      createdById: actorId,
      description: copy.description,
      format: copy.format,
      language: copy.language,
      ownerId,
      publisher: copy.publisher,
      status: "available",
      title: copy.title,
    })
    .returning({ id: libraryBooks.id });
  if (!book) {
    throw new Error("Failed to add the book");
  }
  await logEvent(tx, {
    actorId,
    bookId: book.id,
    details: { author: copy.author, source: "sheet", title: copy.title },
    subjectId: ownerId,
    type: "added",
  });
  return book.id;
}

/** Fills in the details the book list adds to a stored book. */
async function updateBook(
  tx: Tx,
  actorId: string,
  { changes, id }: Plan["books"]["changed"][number]
) {
  if (changes.length === 0) {
    return;
  }
  const set: Partial<typeof libraryBooks.$inferInsert> = {};
  for (const change of changes) {
    set[change.field] = change.to;
  }
  await tx.update(libraryBooks).set(set).where(eq(libraryBooks.id, id));
  await logEvent(tx, {
    actorId,
    bookId: id,
    details: {
      changed: changes.map((change) => change.field),
      source: "sheet",
    },
    type: "edited",
  });
}

/** A loan from the lending history as the preview shows it. */
const loanPreview = (
  loan: PlannedLoan,
  accountOf: (userId: string) => { id: string; name: string } | null
) => ({
  borrower: accountOf(loan.borrowerId)?.name ?? loan.borrower,
  dueOn: loan.dueOn,
  extensions: loan.extended.length,
  from: loan.from,
  key: `${loan.ref} ${loan.borrowerId} ${loan.from}`,
  open: loan.open,
  replaces: loan.replacesLoanId !== null,
  returnedOn: loan.returnedAt ? localDay(loan.returnedAt) : null,
  rows: loan.rows,
  title: loan.title,
  to: loan.to,
});

/** A loan the rerun brings up to date, as the preview shows it. */
const updatePreview = (
  update: LoanUpdate,
  accountOf: (userId: string) => { id: string; name: string } | null
) => ({
  action: update.action,
  added: update.added.length,
  borrower: accountOf(update.borrowerId)?.name ?? update.borrower,
  dueOn: update.dueOn,
  from: update.from,
  key: `${update.loanId}`,
  returnedOn: update.returnedAt ? localDay(update.returnedAt) : null,
  rows: update.rows,
  title: update.title,
  to: update.to,
});

export const libraryImportRouter = createTRPCRouter({
  /**
   * What importing the sheet would do, without writing anything: new copies,
   * books it adds details or a loan to, what's up to date or skipped, names
   * without an account (with a suggested one) and the lending history's
   * loans and the rows it can't place.
   */
  preview: adminProcedure.query(async () => {
    const sheet = await readSheet();
    const { books, lending } = await planWith(db, sheet);
    const accounts = await db
      .select({ id: users.id, image: users.image, name: users.name })
      .from(users);
    const accountOf = (userId: string | null) => {
      if (!userId) {
        return null;
      }
      const account = accounts.find((item) => item.id === userId);
      return {
        id: userId,
        image: account?.image ?? null,
        name: account?.name ?? "Unnamed account",
      };
    };
    const copyOf = (copy: (typeof sheet.books.copies)[number]) => ({
      author: copy.author,
      category: copy.category,
      format: copy.format,
      language: copy.language,
      publisher: copy.publisher,
      row: copy.row,
      title: copy.title,
    });
    return {
      added: books.added.map(({ borrowerId, copy, ownerId }) => ({
        ...copyOf(copy),
        borrower: accountOf(borrowerId),
        owner: accountOf(ownerId),
      })),
      changed: books.changed.map(
        ({ borrowerId, changes, copy, id, ownerId }) => ({
          ...copyOf(copy),
          borrower: accountOf(borrowerId),
          changes,
          id,
          owner: accountOf(ownerId),
        })
      ),
      copies: sheet.books.copies.length,
      lending: {
        imported: lending.imported,
        loans: lending.loans.map((loan) => loanPreview(loan, accountOf)),
        onSite: lending.onSite.map((loan) => loanPreview(loan, accountOf)),
        problems: lending.problems,
        rows: sheet.lending.rows.length,
        skipped: lending.skipped,
        unmatchedExtends: lending.unmatchedExtends,
        updates: lending.updates.map((update) =>
          updatePreview(update, accountOf)
        ),
      },
      ownerUnlinked: books.ownerUnlinked.map((copy) => ({
        ...copyOf(copy),
        owner: copy.owner ?? "",
      })),
      skipped: books.skipped,
      unchanged: books.unchanged,
      unknownLanguages: books.unknownLanguages,
      unlinkedLoans: books.unlinkedLoans.map((copy) => ({
        lentTo: copy.lentTo ?? "",
        row: copy.row,
        title: copy.title,
      })),
      unmatched: books.unmatched.map((item) => ({
        ...item,
        suggestion: suggestAccount(item.name, accounts),
      })),
    };
  }),

  /**
   * Imports the sheet, all or nothing: adds new copies and fills in details,
   * brings loans an earlier import wrote up to date (later `extend` rows,
   * returns and reopens), then writes the lending history's new loans, then
   * starts a loan today for a
   * "Lent to" the history doesn't know. The sheet is read again and planned
   * under a table lock, so the result never depends on a stale preview and
   * two runs can't both add a book or a loan. Nothing is deleted or cleared.
   */
  run: adminProcedure.mutation(async ({ ctx }) => {
    const sheet = await readSheet();
    const actorId = ctx.session.user.id;
    const notices: ReadyNotice[] = [];
    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`lock table ${libraryBooks} in share row exclusive mode`
      );
      const { books, lending } = await planWith(tx, sheet);
      const ids = new Map<string, number>();
      const lentToday: { bookId: number; userId: string }[] = [];
      for (const [index, planned] of books.added.entries()) {
        // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
        const bookId = await addBook(tx, actorId, planned);
        ids.set(`new:${index}`, bookId);
        if (planned.borrowerId) {
          lentToday.push({ bookId, userId: planned.borrowerId });
        }
      }
      for (const planned of books.changed) {
        // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
        await updateBook(tx, actorId, planned);
        if (planned.borrowerId) {
          lentToday.push({ bookId: planned.id, userId: planned.borrowerId });
        }
      }
      const bookOf = (ref: string) =>
        ids.get(ref) ?? Number(ref.replace("id:", ""));
      // Updates first: a loan returned now frees its book for a newer one.
      for (const update of lending.updates) {
        // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
        await writeLoanUpdate(
          tx,
          { actorId, bookId: bookOf(update.ref), update },
          notices
        );
      }
      for (const loan of lending.loans) {
        // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
        await writeSheetLoan(tx, { actorId, bookId: bookOf(loan.ref), loan });
      }
      for (const { bookId, userId } of lentToday) {
        // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
        await startLoan(
          tx,
          { actorId, bookId, source: "sheet", userId },
          notices
        );
      }
      return {
        added: books.added.length,
        loans: lending.loans.length + lentToday.length,
        loanUpdates: lending.updates.length,
        updated: books.changed.length,
      };
    });
    sendReadyEmailsLater(notices);
    return result;
  }),

  /** Whether a library sheet is set, and its title and link. */
  status: adminProcedure.query(async () => {
    const sheetId = await librarySheetId();
    if (!sheetId) {
      return { sheet: null };
    }
    return {
      sheet: {
        id: sheetId,
        title: await sheetTitle(sheetId).catch(() => null),
        url: sheetUrl(sheetId),
      },
    };
  }),
});
