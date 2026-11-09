import { TRPCError } from "@trpc/server";
import { eq, inArray, sql } from "drizzle-orm";
import {
  libraryBooks,
  libraryLoans,
  libraryQueue,
  users,
} from "~/lib/db/schema/schema";
import {
  type LibrarySheet,
  parseLibrarySheet,
  planLibraryImport,
  type StoredBook,
} from "~/lib/library-import";
import { suggestAccount } from "~/lib/people";
import { sheetUrl } from "~/lib/settings";
import { db } from "~/server";
import { sheetTabs, sheetTitle, sheetValues } from "~/server/google-sheets";
import { logEvent, startLoan } from "~/server/library";
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

/** The book list: the sheet's first tab. */
async function readSheet(): Promise<LibrarySheet> {
  const sheetId = await librarySheetId();
  if (!sheetId) {
    throw noSheet();
  }
  const [tab] = await fromGoogle(() => sheetTabs(sheetId));
  if (!tab) {
    return { copies: [], skipped: [], unknownLanguages: [] };
  }
  return parseLibrarySheet(await fromGoogle(() => sheetValues(sheetId, tab)));
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

async function planWith(executor: Executor, sheet: LibrarySheet) {
  const names = sheet.copies.flatMap((copy) =>
    [copy.owner, copy.lentTo].filter((name): name is string => Boolean(name))
  );
  const [accountFor, stored] = await Promise.all([
    // A savepoint inside `run`'s transaction, a short transaction otherwise.
    executor.transaction((tx) => resolveAccounts(tx, names)),
    loadStored(executor),
  ]);
  return planLibraryImport({ accountFor, sheet, stored });
}

export const libraryImportRouter = createTRPCRouter({
  /**
   * What importing the sheet would do, without writing anything: new copies,
   * books it adds details or a loan to, what's up to date or skipped, and
   * names without an account (with a suggested one).
   */
  preview: adminProcedure.query(async () => {
    const sheet = await readSheet();
    const plan = await planWith(db, sheet);
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
    const copyOf = (copy: (typeof sheet.copies)[number]) => ({
      author: copy.author,
      category: copy.category,
      format: copy.format,
      language: copy.language,
      publisher: copy.publisher,
      row: copy.row,
      title: copy.title,
    });
    return {
      added: plan.added.map(({ borrowerId, copy, ownerId }) => ({
        ...copyOf(copy),
        borrower: accountOf(borrowerId),
        owner: accountOf(ownerId),
      })),
      changed: plan.changed.map(
        ({ borrowerId, changes, copy, id, ownerId }) => ({
          ...copyOf(copy),
          borrower: accountOf(borrowerId),
          changes,
          id,
          owner: accountOf(ownerId),
        })
      ),
      copies: sheet.copies.length,
      ownerUnlinked: plan.ownerUnlinked.map((copy) => ({
        ...copyOf(copy),
        owner: copy.owner ?? "",
      })),
      skipped: plan.skipped,
      unchanged: plan.unchanged,
      unknownLanguages: plan.unknownLanguages,
      unlinkedLoans: plan.unlinkedLoans.map((copy) => ({
        lentTo: copy.lentTo ?? "",
        row: copy.row,
        title: copy.title,
      })),
      unmatched: plan.unmatched.map((item) => ({
        ...item,
        suggestion: suggestAccount(item.name, accounts),
      })),
    };
  }),

  /**
   * Imports the sheet: adds new copies (with their loans) and fills in
   * details, all or nothing. The sheet is read again and planned under a
   * table lock, so the result never depends on a stale preview and two runs
   * can't both add a book. Nothing is deleted or cleared.
   */
  run: adminProcedure.mutation(async ({ ctx }) => {
    const sheet = await readSheet();
    const actorId = ctx.session.user.id;
    return db.transaction(async (tx) => {
      await tx.execute(
        sql`lock table ${libraryBooks} in share row exclusive mode`
      );
      const plan = await planWith(tx, sheet);
      let loans = 0;
      for (const { borrowerId, copy, ownerId } of plan.added) {
        // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
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
        if (borrowerId) {
          await startLoan(tx, {
            actorId,
            bookId: book.id,
            source: "sheet",
            userId: borrowerId,
          });
          loans += 1;
        }
      }
      for (const { borrowerId, changes, id } of plan.changed) {
        if (changes.length > 0) {
          const set: Partial<typeof libraryBooks.$inferInsert> = {};
          for (const change of changes) {
            set[change.field] = change.to;
          }
          // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
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
        if (borrowerId) {
          await startLoan(tx, {
            actorId,
            bookId: id,
            source: "sheet",
            userId: borrowerId,
          });
          loans += 1;
        }
      }
      return {
        added: plan.added.length,
        loans,
        updated: plan.changed.length,
      };
    });
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
