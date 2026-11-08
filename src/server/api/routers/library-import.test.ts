import { eq } from "drizzle-orm";
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
import { LIBRARY_SHEET } from "~/test/fixtures/library-sheet";

const google = vi.hoisted(() => ({ values: [] as string[][] }));
vi.mock("~/server/google-sheets", () => ({
  sheetTabs: vi.fn(async () => ["Books", "Archive"]),
  sheetTitle: vi.fn(async () => "Library books"),
  sheetValues: vi.fn(async () => google.values),
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

  it("previews new copies, unlinked names and skipped rows", async () => {
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
    expect(preview.unlinkedLoans).toEqual([
      { lentTo: "Nadia", row: 7, title: "Small Lamps" },
    ]);
    expect(preview.skipped).toHaveLength(2);
    expect(preview.unknownLanguages).toEqual([
      { row: 7, title: "Small Lamps", value: "Korean" },
    ]);
    expect(
      preview.added.find((copy) => copy.title === "The Lantern Case")
    ).toMatchObject({ borrower: { name: "Dara" }, owner: null });
    expect(await testDb.select().from(libraryBooks)).toEqual([]);
  });

  it("writes books, loans and history, skipping unlinked owners", async () => {
    const { admin, mita, people } = await setup();
    expect(await admin.run()).toEqual({ added: 8, loans: 1, updated: 0 });

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
    expect(loans).toEqual([
      expect.objectContaining({
        bookId: lantern?.id,
        borrowerId: people.get("Dara"),
        dueOn: "2026-12-08",
        returnedAt: null,
      }),
    ]);
    const history = await testDb.select().from(libraryHistory);
    expect(history.filter((event) => event.type === "added")).toHaveLength(8);
    expect(
      history.every(
        (event) =>
          event.actorId === mita.id &&
          (event.details as { source?: string }).source === "sheet"
      )
    ).toBe(true);
    expect(history.find((event) => event.type === "borrowed")).toMatchObject({
      bookId: lantern?.id,
      subjectId: people.get("Dara"),
    });
  });

  it("is idempotent, and adds what was waiting once names are linked", async () => {
    const { admin } = await setup();
    await admin.run();
    const again = await admin.preview();
    expect(again.added).toEqual([]);
    expect(again.changed).toEqual([]);
    expect(again.unchanged).toBe(8);
    expect(await admin.run()).toEqual({ added: 0, loans: 0, updated: 0 });
    expect(await testDb.select().from(libraryBooks)).toHaveLength(8);
    expect(await testDb.select().from(libraryLoans)).toHaveLength(1);

    const wren = await insertUser({ name: "Wren" });
    const nadia = await insertUser({ name: "Nadia" });
    expect(await admin.run()).toEqual({ added: 5, loans: 1, updated: 1 });
    const loans = await testDb.select().from(libraryLoans);
    expect(loans.map((loan) => loan.borrowerId).sort()).toEqual(
      [loans[0]?.borrowerId, nadia.id].sort()
    );
    const rooted = await testDb
      .select()
      .from(libraryBooks)
      .where(eq(libraryBooks.title, "Rooted Hearts"));
    expect(rooted.every((book) => book.ownerId === wren.id)).toBe(true);
    expect(
      rooted.map((book) => `${book.format} ${book.language}`).sort()
    ).toEqual(["ebook en", "ebook id", "physical en", "physical id"]);
    expect((await admin.preview()).unchanged).toBe(13);
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
