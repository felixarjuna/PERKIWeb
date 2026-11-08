import { describe, expect, it } from "vitest";
import { LIBRARY_SHEET } from "~/test/fixtures/library-sheet";
import {
  normaliseCategory,
  normalisePublisher,
  parseLibrarySheet,
  planLibraryImport,
  type StoredBook,
} from "./library-import";

const sheet = parseLibrarySheet(LIBRARY_SHEET);

/** Every fixture name has an account `u-<name>`, except those left out. */
const accounts =
  (...missing: string[]) =>
  (name: string) =>
    missing.includes(name) ? undefined : `u-${name.toLowerCase()}`;

/** The plan's new copies as rows in the library, as a run would store them. */
const storedFrom = (plan: ReturnType<typeof planLibraryImport>) =>
  plan.added.map(
    ({ borrowerId, copy, ownerId }, index): StoredBook => ({
      author: copy.author,
      category: copy.category,
      description: copy.description,
      format: copy.format,
      id: index + 1,
      language: copy.language,
      lendable: borrowerId === null,
      ownerId,
      publisher: copy.publisher,
      title: copy.title,
    })
  );

const copiesOf = (title: string) =>
  sheet.copies
    .filter((copy) => copy.title === title)
    .map(({ format, language, owner }) => ({ format, language, owner }));

describe("parseLibrarySheet", () => {
  it("makes one copy per owner, format and language", () => {
    expect(copiesOf("Quiet Harbour")).toEqual([
      { format: "physical", language: "id", owner: "Arlo" },
      { format: "physical", language: "id", owner: "Wren" },
      { format: "physical", language: "id", owner: "Vito" },
    ]);
    expect(copiesOf("Rooted Hearts")).toEqual([
      { format: "ebook", language: "en", owner: "Wren" },
      { format: "ebook", language: "id", owner: "Wren" },
      { format: "physical", language: "en", owner: "Wren" },
      { format: "physical", language: "id", owner: "Wren" },
    ]);
    expect(copiesOf("Two by Two")).toEqual([
      { format: "physical", language: "id", owner: null },
      { format: "ebook", language: "id", owner: null },
    ]);
    expect(sheet.copies).toHaveLength(13);
  });

  it("reads PERKI, Perki and an empty owner as PERKI's", () => {
    expect(copiesOf("The Lantern Case")[0]?.owner).toBeNull();
    expect(copiesOf("Walking Together")).toEqual([
      { format: "ebook", language: "en", owner: null },
    ]);
  });

  it("reads an empty type as physical and keeps Lent to on a physical copy", () => {
    const [lowly] = sheet.copies.filter((copy) => copy.title === "Lowly Paths");
    expect(lowly?.format).toBe("physical");
    const lent = sheet.copies.filter((copy) => copy.lentTo);
    expect(
      lent.map(({ format, lentTo, title }) => ({ format, lentTo, title }))
    ).toEqual([
      { format: "physical", lentTo: "Dara", title: "The Lantern Case" },
      { format: "physical", lentTo: "Nadia", title: "Small Lamps" },
    ]);
  });

  it("lists link rows as skipped and unknown languages", () => {
    expect(sheet.skipped).toEqual([
      {
        reason: "A link to free books, not a book",
        row: 8,
        title: "Free Christian Books",
      },
      {
        reason: "A link to free books, not a book",
        row: 9,
        title: "Free Christian Books",
      },
    ]);
    expect(sheet.unknownLanguages).toEqual([
      { row: 7, title: "Small Lamps", value: "Korean" },
    ]);
    expect(copiesOf("Small Lamps")[0]?.language).toBeNull();
  });

  it("normalises categories and publishers", () => {
    expect(normaliseCategory(" Apologetic ")).toBe("Apologetics");
    expect(normaliseCategory("Women's Book")).toBe("Women");
    expect(normaliseCategory("Women’s Book")).toBe("Women");
    expect(normaliseCategory("Relationship")).toBe("Relationships");
    expect(normaliseCategory("Gospel Humility")).toBe("Gospel Humility");
    expect(normaliseCategory("")).toBeNull();
    expect(normalisePublisher("Crossway Books")).toBe("Crossway");
    expect(normalisePublisher("Banner Of Truth")).toBe("Banner of Truth");
    expect(normalisePublisher(" ")).toBeNull();
    expect(copiesOf("The Lantern Case")).toHaveLength(1);
    const [lantern] = sheet.copies;
    expect(lantern).toMatchObject({
      category: "Apologetics",
      description: "A detective weighs the evidence for the resurrection.",
      publisher: "Crossway",
    });
  });

  it("finds no books without a Title/Author header", () => {
    expect(
      parseLibrarySheet([
        ["Name", "Notes"],
        ["x", "y"],
      ]).copies
    ).toEqual([]);
  });
});

describe("planLibraryImport", () => {
  it("adds every copy on the first run, with its loans", () => {
    const plan = planLibraryImport({
      accountFor: accounts(),
      sheet,
      stored: [],
    });
    expect(plan.added).toHaveLength(13);
    expect(plan.unmatched).toEqual([]);
    const lantern = plan.added.find(
      (item) => item.copy.title === "The Lantern Case"
    );
    expect(lantern).toMatchObject({ borrowerId: "u-dara", ownerId: null });
    expect(plan.skipped).toHaveLength(2);
  });

  it("holds back copies whose owner isn't linked, and loans without a borrower", () => {
    const plan = planLibraryImport({
      accountFor: accounts("Wren", "Nadia"),
      sheet,
      stored: [],
    });
    // Wren's Quiet Harbour copy and four Rooted Hearts copies wait.
    expect(plan.ownerUnlinked).toHaveLength(5);
    expect(plan.added).toHaveLength(8);
    const small = plan.added.find((item) => item.copy.title === "Small Lamps");
    expect(small).toMatchObject({ borrowerId: null, ownerId: "u-arlo" });
    expect(plan.unlinkedLoans.map((copy) => copy.title)).toEqual([
      "Small Lamps",
    ]);
    expect(plan.unmatched).toEqual([
      { as: ["owner"], name: "Wren", rows: [4, 5] },
      { as: ["borrower"], name: "Nadia", rows: [7] },
    ]);
  });

  it("finds everything unchanged on a second run", () => {
    const first = planLibraryImport({
      accountFor: accounts(),
      sheet,
      stored: [],
    });
    const again = planLibraryImport({
      accountFor: accounts(),
      sheet,
      stored: storedFrom(first).map((book) => ({ ...book, lendable: false })),
    });
    expect(again.added).toEqual([]);
    expect(again.changed).toEqual([]);
    expect(again.unchanged).toBe(13);
  });

  it("fills in missing details but never clears one", () => {
    const first = planLibraryImport({
      accountFor: accounts(),
      sheet,
      stored: [],
    });
    const stored = storedFrom(first).map((book) =>
      book.title === "The Lantern Case"
        ? { ...book, category: null, lendable: false, publisher: "Other" }
        : { ...book, lendable: false }
    );
    const blankSheet = {
      ...sheet,
      copies: sheet.copies.map((copy) =>
        copy.title === "Lowly Paths" ? { ...copy, category: null } : copy
      ),
    };
    const plan = planLibraryImport({
      accountFor: accounts(),
      sheet: blankSheet,
      stored,
    });
    expect(plan.changed).toHaveLength(1);
    expect(plan.changed[0]?.changes).toEqual([
      { field: "publisher", from: "Other", to: "Crossway" },
      { field: "category", from: null, to: "Apologetics" },
    ]);
    expect(plan.unchanged).toBe(12);
  });

  it("starts a late-linked loan only on a book that was never lent", () => {
    const first = planLibraryImport({
      accountFor: accounts("Dara"),
      sheet,
      stored: [],
    });
    const stored = storedFrom(first).map((book) => ({
      ...book,
      lendable: true,
    }));
    const linked = planLibraryImport({ accountFor: accounts(), sheet, stored });
    expect(linked.changed).toEqual([
      expect.objectContaining({ borrowerId: "u-dara", changes: [] }),
      expect.objectContaining({ borrowerId: "u-nadia", changes: [] }),
    ]);
    const lentBefore = planLibraryImport({
      accountFor: accounts(),
      sheet,
      stored: stored.map((book) => ({ ...book, lendable: false })),
    });
    expect(lentBefore.changed).toEqual([]);
  });

  it("matches a stored copy without a language", () => {
    const plan = planLibraryImport({
      accountFor: accounts(),
      sheet,
      stored: [
        {
          author: "mara  ellison",
          category: "Apologetics",
          description: "A detective weighs the evidence for the resurrection.",
          format: "physical",
          id: 99,
          language: null,
          lendable: false,
          ownerId: null,
          publisher: "Crossway",
          title: "the lantern case",
        },
      ],
    });
    expect(plan.changed).toEqual([
      expect.objectContaining({
        changes: [{ field: "language", from: null, to: "en" }],
        id: 99,
      }),
    ]);
    expect(plan.added).toHaveLength(12);
  });
});
