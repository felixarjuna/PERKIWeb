import { and, eq, isNull } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  libraryBooks,
  libraryHistory,
  libraryLoans,
  settings,
} from "~/lib/db/schema/schema";
import { SETTING_KEYS } from "~/lib/settings";
import { callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";
import { LENDING_SHEET, LIBRARY_SHEET } from "~/test/fixtures/library-sheet";

const google = vi.hoisted(() => ({
  lending: [] as string[][],
  values: [] as string[][],
}));
vi.mock("~/server/google-sheets", () => ({
  sheetTabs: vi.fn(async () => ["Books", "Peminjaman", "Archive"]),
  sheetTitle: vi.fn(async () => "Library books"),
  sheetValues: vi.fn(async (_id: string, tab: string) =>
    tab === "Peminjaman" ? google.lending : google.values
  ),
}));

// Sunday 8 Nov 2026, noon in Aachen.
const NOW = new Date("2026-11-08T11:00:00Z");

/** Accounts for the fixture's people; Wren and Nadia are left out unless asked. */
async function setup({ everyone = false } = {}) {
  const mita = await insertUser({ name: "Mita Staff", role: "mita" });
  const names = ["Arlo", "Vito", "Kai", "Dara"];
  if (everyone) {
    names.push("Wren", "Nadia");
  }
  const people = new Map<string, string>();
  for (const name of names) {
    // biome-ignore lint/performance/noAwaitInLoops: a few test accounts.
    people.set(name, (await insertUser({ name })).id);
  }
  return { admin: callerFor(mita.id).libraryImport, mita, people };
}

describe("libraryImport", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
    google.values = LIBRARY_SHEET;
    google.lending = LENDING_SHEET;
    await testDb
      .insert(settings)
      .values({ key: SETTING_KEYS.librarySheetId, value: "library-sheet-id" });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is for staff only", async () => {
    const member = callerFor((await insertUser({ name: "Member" })).id);
    await expect(member.libraryImport.preview()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(member.libraryImport.run()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(member.libraryImport.status()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("asks for the sheet until one is set", async () => {
    await testDb
      .delete(settings)
      .where(eq(settings.key, SETTING_KEYS.librarySheetId));
    const { admin } = await setup();
    expect(await admin.status()).toEqual({ sheet: null });
    await expect(admin.preview()).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
  });

  it("previews new copies, the lending history, unlinked names and skipped rows", async () => {
    const { admin } = await setup();
    const preview = await admin.preview();
    expect(preview.copies).toBe(13);
    // Wren's five copies wait for their owner's account.
    expect(preview.added).toHaveLength(8);
    expect(preview.ownerUnlinked).toHaveLength(5);
    expect(preview.unmatched.map((item) => item.name)).toEqual([
      "Wren",
      "Nadia",
    ]);
    expect(preview.unmatched[1]).toMatchObject({ lendingRows: [13, 19] });
    expect(preview.unlinkedLoans).toEqual([
      { lentTo: "Nadia", row: 7, title: "Small Lamps" },
    ]);
    expect(preview.skipped).toHaveLength(2);
    expect(preview.unknownLanguages).toEqual([
      { row: 7, title: "Small Lamps", value: "Korean" },
    ]);
    // The history knows when Dara's loan began, so it doesn't start today.
    expect(
      preview.added.find((copy) => copy.title === "The Lantern Case")
    ).toMatchObject({ borrower: null, owner: null });
    expect(preview.lending.rows).toBe(14);
    expect(preview.lending.loans).toHaveLength(7);
    expect(preview.lending.loans.find((loan) => loan.open)).toMatchObject({
      borrower: "Dara",
      dueOn: "2026-10-03",
      extensions: 1,
      from: "2026-08",
      returnedOn: null,
      title: "The Lantern Case",
      to: "2026-09",
    });
    expect(preview.lending.problems.map((item) => item.row)).toEqual([
      12, 13, 19, 20,
    ]);
    expect(preview.lending.unmatchedExtends).toHaveLength(1);
    expect(await testDb.select().from(libraryBooks)).toEqual([]);
    expect(await testDb.select().from(libraryLoans)).toEqual([]);
  });

  it("writes books, the lending history and its events, skipping unlinked owners", async () => {
    const { admin, mita, people } = await setup();
    expect(await admin.run()).toEqual({ added: 8, loans: 7, updated: 0 });

    const books = await testDb.select().from(libraryBooks);
    expect(books).toHaveLength(8);
    expect(books.some((book) => book.title === "Rooted Hearts")).toBe(false);
    const lantern = books.find((book) => book.title === "The Lantern Case");
    expect(lantern).toMatchObject({
      category: "Apologetics",
      format: "physical",
      language: "en",
      ownerId: null,
      publisher: "Crossway",
      status: "borrowed",
    });
    const walking = books.find((book) => book.title === "Walking Together");
    expect(walking).toMatchObject({ format: "ebook", status: "available" });
    expect(
      books
        .filter((book) => book.title === "Quiet Harbour")
        .map((book) => book.ownerId)
        .sort()
    ).toEqual([people.get("Arlo"), people.get("Vito")].sort());

    const loans = await testDb.select().from(libraryLoans);
    expect(loans).toHaveLength(7);
    const lanternLoans = loans
      .filter((loan) => loan.bookId === lantern?.id)
      .sort((a, b) => a.borrowedAt.getTime() - b.borrowedAt.getTime());
    expect(lanternLoans).toEqual([
      expect.objectContaining({
        borrowedAt: new Date("2026-05-31T22:00:00Z"),
        borrowerId: people.get("Kai"),
        dueOn: "2026-08-01",
        extensions: 1,
        returnedAt: new Date("2026-08-01T13:30:00Z"),
        returnedById: null,
      }),
      // Still "Lent to" Dara on the book list: open, and overdue since 4 Oct.
      expect.objectContaining({
        borrowedAt: new Date("2026-07-31T22:00:00Z"),
        borrowerId: people.get("Dara"),
        dueOn: "2026-10-03",
        extensions: 1,
        returnedAt: null,
      }),
    ]);
    expect(loans.filter((loan) => loan.returnedAt === null)).toHaveLength(1);

    const history = await testDb.select().from(libraryHistory);
    expect(history.filter((event) => event.type === "added")).toHaveLength(8);
    expect(
      history.every(
        (event) =>
          event.actorId === mita.id &&
          (event.details as { source?: string }).source === "sheet"
      )
    ).toBe(true);
    const daraLines = history
      .filter((event) => event.loanId === lanternLoans[1]?.id)
      .map((event) => ({
        at: event.at,
        details: event.details,
        type: event.type,
      }));
    expect(daraLines).toEqual([
      {
        at: new Date("2026-07-31T22:00:00Z"),
        details: {
          dueOn: "2026-09-05",
          month: "2026-08",
          precision: "month",
          source: "sheet",
        },
        type: "borrowed",
      },
      {
        at: new Date("2026-08-31T22:00:00Z"),
        details: {
          dueOn: "2026-10-03",
          month: "2026-09",
          precision: "month",
          source: "sheet",
        },
        type: "extended",
      },
    ]);
    expect(
      history.filter(
        (event) =>
          event.type === "returned" && event.subjectId === people.get("Kai")
      )
    ).toHaveLength(2);
  });

  it("is idempotent, and adds what was waiting once names are linked", async () => {
    const { admin } = await setup();
    await admin.run();
    const historyLines = (await testDb.select().from(libraryHistory)).length;
    const again = await admin.preview();
    expect(again.added).toEqual([]);
    expect(again.changed).toEqual([]);
    expect(again.unchanged).toBe(8);
    expect(again.lending.loans).toEqual([]);
    expect(again.lending.imported).toBe(7);
    expect(await admin.run()).toEqual({ added: 0, loans: 0, updated: 0 });
    expect(await testDb.select().from(libraryBooks)).toHaveLength(8);
    expect(await testDb.select().from(libraryLoans)).toHaveLength(7);
    expect(await testDb.select().from(libraryHistory)).toHaveLength(
      historyLines
    );

    const wren = await insertUser({ name: "Wren" });
    const nadia = await insertUser({ name: "Nadia" });
    // Nadia's Small Lamps (open since August) and Wren's Quiet Harbour.
    expect(await admin.run()).toEqual({ added: 5, loans: 2, updated: 0 });
    const open = await testDb
      .select()
      .from(libraryLoans)
      .where(isNull(libraryLoans.returnedAt));
    expect(open.map((loan) => loan.borrowerId).sort()).toEqual(
      [
        nadia.id,
        open.find((loan) => loan.borrowerId !== nadia.id)?.borrowerId,
      ].sort()
    );
    expect(open.find((loan) => loan.borrowerId === nadia.id)).toMatchObject({
      borrowedAt: new Date("2026-07-31T22:00:00Z"),
      dueOn: "2026-11-07",
    });
    const rooted = await testDb
      .select()
      .from(libraryBooks)
      .where(eq(libraryBooks.title, "Rooted Hearts"));
    expect(rooted.every((book) => book.ownerId === wren.id)).toBe(true);
    expect(
      rooted.map((book) => `${book.format} ${book.language}`).sort()
    ).toEqual(["ebook en", "ebook id", "physical en", "physical id"]);
    const last = await admin.preview();
    expect(last.unchanged).toBe(13);
    expect(last.lending.imported).toBe(9);
  });

  it("moves a loan an earlier import started today to its month on the sheet", async () => {
    const { admin, people } = await setup();
    google.lending = [];
    expect(await admin.run()).toMatchObject({ loans: 1 });
    const [today] = await testDb.select().from(libraryLoans);
    expect(today).toMatchObject({ dueOn: "2026-12-08", returnedAt: null });

    google.lending = LENDING_SHEET;
    const preview = await admin.preview();
    expect(preview.lending.loans.find((loan) => loan.open)).toMatchObject({
      replaces: true,
    });
    expect(await admin.run()).toMatchObject({ loans: 7 });
    const lantern = await testDb
      .select()
      .from(libraryLoans)
      .where(
        and(
          eq(libraryLoans.bookId, today?.bookId ?? 0),
          isNull(libraryLoans.returnedAt)
        )
      );
    expect(lantern).toEqual([
      expect.objectContaining({
        borrowedAt: new Date("2026-07-31T22:00:00Z"),
        borrowerId: people.get("Dara"),
        dueOn: "2026-10-03",
        extensions: 1,
        id: today?.id,
      }),
    ]);
    const borrowed = await testDb
      .select()
      .from(libraryHistory)
      .where(
        and(
          eq(libraryHistory.loanId, today?.id ?? 0),
          eq(libraryHistory.type, "borrowed")
        )
      );
    expect(borrowed).toEqual([
      expect.objectContaining({
        at: new Date("2026-07-31T22:00:00Z"),
        details: expect.objectContaining({
          month: "2026-08",
          precision: "month",
        }),
      }),
    ]);
    expect((await admin.preview()).lending.loans).toEqual([]);
  });

  it("leaves a loan made on the site alone", async () => {
    const { admin, mita, people } = await setup();
    google.lending = [];
    await admin.run();
    const [lantern] = await testDb
      .select()
      .from(libraryBooks)
      .where(eq(libraryBooks.title, "The Lantern Case"));
    // Staff take the book back and lend it to Kai on the site.
    await callerFor(mita.id).library.markReturned({ id: lantern?.id ?? 0 });
    await callerFor(mita.id).library.lend({
      id: lantern?.id ?? 0,
      userId: people.get("Kai") ?? "",
    });

    google.lending = LENDING_SHEET;
    const preview = await admin.preview();
    expect(preview.lending.onSite).toEqual([
      expect.objectContaining({ borrower: "Dara", title: "The Lantern Case" }),
    ]);
    await admin.run();
    const open = await testDb
      .select()
      .from(libraryLoans)
      .where(
        and(
          eq(libraryLoans.bookId, lantern?.id ?? 0),
          isNull(libraryLoans.returnedAt)
        )
      );
    expect(open.map((loan) => loan.borrowerId)).toEqual([people.get("Kai")]);
  });

  it("fills in details staff left empty, never clearing one", async () => {
    const { admin } = await setup({ everyone: true });
    await admin.run();
    await testDb
      .update(libraryBooks)
      .set({ category: null, publisher: "Kept Press" })
      .where(eq(libraryBooks.title, "Lowly Paths"));
    const preview = await admin.preview();
    expect(preview.changed).toEqual([
      expect.objectContaining({
        changes: [{ field: "category", from: null, to: "Gospel Humility" }],
        title: "Lowly Paths",
      }),
    ]);
    await admin.run();
    const [lowly] = await testDb
      .select()
      .from(libraryBooks)
      .where(eq(libraryBooks.title, "Lowly Paths"));
    expect(lowly).toMatchObject({
      category: "Gospel Humility",
      publisher: "Kept Press",
    });
  });
});
