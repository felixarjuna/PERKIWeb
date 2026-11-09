import { describe, expect, it } from "vitest";
import { LENDING_SHEET, LIBRARY_SHEET } from "~/test/fixtures/library-sheet";
import {
  type CurrentLoan,
  firstSaturdayOfNextMonth,
  type ImportedLoan,
  type LendingInput,
  loanUpdateEvents,
  monthLabel,
  normaliseCategory,
  normalisePublisher,
  parseLendingSheet,
  parseLibrarySheet,
  planLendingHistory,
  planLibraryImport,
  type StoredBook,
  sheetLoanEvents,
  sheetMonth,
  withoutCoveredLoans,
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
      { as: ["owner"], lendingRows: [], name: "Wren", rows: [4, 5] },
      { as: ["borrower"], lendingRows: [], name: "Nadia", rows: [7] },
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

describe("firstSaturdayOfNextMonth", () => {
  it("is the first Saturday of the month after", () => {
    // June 2026 → Wednesday 1 July, so Saturday the 4th.
    expect(firstSaturdayOfNextMonth("2026-06")).toBe("2026-07-04");
  });

  it("is the 1st when the next month starts on a Saturday", () => {
    expect(firstSaturdayOfNextMonth("2026-07")).toBe("2026-08-01");
  });

  it("is the 7th after a month ending on a Saturday", () => {
    // January 2026 ends on Saturday the 31st.
    expect(firstSaturdayOfNextMonth("2026-01")).toBe("2026-02-07");
  });

  it("is the 7th when the next month starts on a Sunday", () => {
    // March 2026 starts on a Sunday.
    expect(firstSaturdayOfNextMonth("2026-02")).toBe("2026-03-07");
  });

  it("goes from December into January of the next year", () => {
    expect(firstSaturdayOfNextMonth("2026-12")).toBe("2027-01-02");
    expect(firstSaturdayOfNextMonth("2025-12")).toBe("2026-01-03");
  });
});

describe("parseLendingSheet", () => {
  const lending = parseLendingSheet(LENDING_SHEET);

  it("carries the year and month down and skips separator rows", () => {
    expect(
      lending.rows.map(({ month, row, title }) => `${row} ${month} ${title}`)
    ).toEqual([
      "2 2025-12 Lowly Paths",
      "4 2026-06 The Lantern Case",
      "5 2026-06 Quiet Harbour",
      "6 2026-06 Lowly Paths",
      "8 2026-07 The Lantern Case",
      "9 2026-07 Quiet Harbour",
      "11 2026-08 The Lantern Case",
      "12 2026-08 Morning Psalms",
      "13 2026-08 Small Lamps",
      "15 2026-09 The Lantern Case",
      "16 2026-09 Lowly Paths",
      "17 2026-09 Quiet Harbour",
      "19 2026-10 Small Lamps",
      "20 2026-10 Quiet Harbour",
    ]);
    expect(lending.skipped).toEqual([]);
  });

  it("reads extend, PERKI as no owner, and the borrower", () => {
    expect(lending.rows[4]).toEqual({
      borrower: "Kai",
      extend: true,
      month: "2026-07",
      owner: null,
      row: 8,
      title: "The Lantern Case",
    });
    expect(lending.rows[2]).toMatchObject({ extend: false, owner: "Arlo" });
  });

  it("skips rows without a month or a borrower", () => {
    expect(
      parseLendingSheet([
        ["Tahun", "Bulan", "Title", "Pemilik", "Peminjam", "Catatan"],
        ["", "", "Early Book", "PERKI", "Dara"],
        ["2026", "Smarch", "Odd Month", "PERKI", "Dara"],
        ["2026", "Mei", "Nobody", "PERKI", ""],
        ["", "", "Carried", "PERKI", "Dara"],
      ])
    ).toEqual({
      rows: [
        {
          borrower: "Dara",
          extend: false,
          month: "2026-05",
          owner: null,
          row: 5,
          title: "Carried",
        },
      ],
      skipped: [
        { reason: "No month", row: 2, title: "Early Book" },
        { reason: "Unknown month “Smarch”", row: 3, title: "Odd Month" },
        { reason: "No borrower", row: 4, title: "Nobody" },
      ],
    });
  });

  it("reads month names and numbers", () => {
    expect(sheetMonth("2026", "Agustus")).toBe("2026-08");
    expect(sheetMonth("2026", "march")).toBe("2026-03");
    expect(sheetMonth("2026", "10")).toBe("2026-10");
    expect(sheetMonth("", "Juli")).toBeNull();
    expect(monthLabel("2026-07")).toBe("July 2026");
  });
});

describe("planLendingHistory", () => {
  const NOW = new Date("2026-11-08T11:00:00Z");
  const lending = parseLendingSheet(LENDING_SHEET);

  /** The book list planned first, as the import does. */
  const inputFor = (
    accountFor: (name: string) => string | undefined,
    extra: Partial<LendingInput> = {}
  ): LendingInput => {
    const books = planLibraryImport({ accountFor, sheet, stored: [] });
    return {
      accountFor,
      current: [],
      imported: [],
      now: NOW,
      placed: books.placed,
      sheet: lending,
      unmatched: books.unmatched,
      ...extra,
    };
  };
  const refOf = (input: LendingInput, title: string, owner: string | null) =>
    input.placed.find(
      (copy) =>
        copy.title === title &&
        copy.format === "physical" &&
        copy.ownerId === owner
    )?.ref;
  /** The loans a run of `plan` stored, as the next import reads them. */
  const importedFrom = (
    plan: ReturnType<typeof planLendingHistory>
  ): ImportedLoan[] =>
    plan.loans.map((loan, index) => ({
      borrowerId: loan.borrowerId,
      dueOn: loan.dueOn,
      extensions: loan.extended.length,
      loanId: index + 1,
      month: loan.from,
      ref: loan.ref,
      returnedAt: loan.returnedAt,
      returnedById: null,
      sheetExtensions: loan.extended.length,
    }));
  /** Today's open loans after a run of `plan`. */
  const currentFrom = (
    plan: ReturnType<typeof planLendingHistory>
  ): CurrentLoan[] =>
    importedFrom(plan)
      .filter((loan) => loan.returnedAt === null)
      .map((loan) => ({
        borrowerId: loan.borrowerId,
        fromLentTo: false,
        loanId: loan.loanId,
        ref: loan.ref,
      }));
  const summary = (plan: ReturnType<typeof planLendingHistory>) =>
    plan.loans.map(
      (loan) =>
        `${loan.title} → ${loan.borrower}: ${loan.from}…${loan.to}, ${loan.extended.length} ext, due ${loan.dueOn}, ${loan.open ? "open" : "returned"}`
    );

  it("plans each loan with the first-Saturday dates, open or returned", () => {
    const plan = planLendingHistory(inputFor(accounts("Wren", "Nadia")));
    expect(summary(plan)).toEqual([
      "Lowly Paths → Dara: 2025-12…2025-12, 0 ext, due 2026-01-03, returned",
      "The Lantern Case → Kai: 2026-06…2026-07, 1 ext, due 2026-08-01, returned",
      "Quiet Harbour → Dara: 2026-06…2026-07, 1 ext, due 2026-08-01, returned",
      "Lowly Paths → Vito: 2026-06…2026-06, 0 ext, due 2026-07-04, returned",
      "The Lantern Case → Dara: 2026-08…2026-09, 1 ext, due 2026-10-03, open",
      "Lowly Paths → Arlo: 2026-09…2026-09, 0 ext, due 2026-10-03, returned",
      "Quiet Harbour → Kai: 2026-09…2026-09, 0 ext, due 2026-10-03, returned",
    ]);
    const [lowly] = plan.loans;
    // The 1st of the month, and the gathering at 15:30, both in Aachen.
    expect(lowly?.borrowedAt.toISOString()).toBe("2025-11-30T23:00:00.000Z");
    expect(lowly?.returnedAt?.toISOString()).toBe("2026-01-03T14:30:00.000Z");
    const open = plan.loans.find((loan) => loan.open);
    expect(open?.returnedAt).toBeNull();
    expect(open?.extended).toEqual([{ dueOn: "2026-10-03", month: "2026-09" }]);
  });

  it("matches each copy by owner when a title has several", () => {
    const input = inputFor(accounts("Wren", "Nadia"));
    const plan = planLendingHistory(input);
    const harbour = plan.loans.filter((loan) => loan.title === "Quiet Harbour");
    expect(harbour.map((loan) => loan.ref)).toEqual([
      refOf(input, "Quiet Harbour", "u-arlo"),
      refOf(input, "Quiet Harbour", "u-vito"),
    ]);
  });

  it("reports unknown titles, names without an account and lone extends", () => {
    const input = inputFor(accounts("Wren", "Nadia"));
    const plan = planLendingHistory(input);
    expect(plan.problems).toEqual([
      {
        reason: "No copy with this title in the book list",
        row: 12,
        title: "Morning Psalms",
      },
      {
        reason: "Borrower Nadia has no account yet",
        row: 13,
        title: "Small Lamps",
      },
      {
        reason: "Borrower Nadia has no account yet",
        row: 19,
        title: "Small Lamps",
      },
      {
        reason: "Owner Wren has no account yet",
        row: 20,
        title: "Quiet Harbour",
      },
    ]);
    expect(plan.unmatchedExtends).toEqual([
      {
        reason:
          "Extended for Arlo without an earlier lend, so counted as a lend",
        row: 16,
        title: "Lowly Paths",
      },
    ]);
    expect(input.unmatched).toEqual([
      { as: ["owner"], lendingRows: [20], name: "Wren", rows: [4, 5] },
      { as: ["borrower"], lendingRows: [13, 19], name: "Nadia", rows: [7] },
    ]);
  });

  it("keeps an open loan open even when its due date has passed", () => {
    const plan = planLendingHistory(inputFor(accounts()));
    const small = plan.loans.find((loan) => loan.title === "Small Lamps");
    expect(small).toMatchObject({
      dueOn: "2026-11-07",
      extended: [{ dueOn: "2026-11-07", month: "2026-10" }],
      from: "2026-08",
      open: true,
      returnedAt: null,
    });
    // Wren's copy came back at the gathering on 7 November.
    const wren = plan.loans.find(
      (loan) => loan.title === "Quiet Harbour" && loan.from === "2026-10"
    );
    expect(wren?.returnedAt?.toISOString()).toBe("2026-11-07T14:30:00.000Z");
  });

  it("never returns a book later than now", () => {
    const now = new Date("2026-11-02T10:00:00Z");
    const plan = planLendingHistory(inputFor(accounts(), { now }));
    const wren = plan.loans.find(
      (loan) => loan.title === "Quiet Harbour" && loan.from === "2026-10"
    );
    expect(wren?.returnedAt).toEqual(now);
  });

  it("writes nothing again on a rerun", () => {
    const input = inputFor(accounts());
    const first = planLendingHistory(input);
    const again = planLendingHistory({
      ...input,
      current: first.loans
        .filter((loan) => loan.open)
        .map((loan, index) => ({
          borrowerId: loan.borrowerId,
          fromLentTo: false,
          loanId: index + 1,
          ref: loan.ref,
        })),
      imported: importedFrom(first),
    });
    expect(again.loans).toEqual([]);
    expect(again.onSite).toEqual([]);
    expect(again.updates).toEqual([]);
    expect(again.imported).toBe(first.loans.length);
  });

  describe("on a rerun", () => {
    const LENT_TO = 8;
    /** The book list with `title`'s "Lent to" set to `name`. */
    const lentTo = (title: string, name: string) =>
      LIBRARY_SHEET.map((cells) => {
        if (cells[1] !== title) {
          return cells;
        }
        const row = [...cells];
        while (row.length <= LENT_TO) {
          row.push("");
        }
        row[LENT_TO] = name;
        return row;
      });
    /** The import's input for a book list and lending tab. */
    const planFor = (
      books: string[][],
      rows: string[][],
      extra: Partial<LendingInput> = {}
    ) => {
      const accountFor = accounts();
      const placed = planLibraryImport({
        accountFor,
        sheet: parseLibrarySheet(books),
        stored: [],
      });
      return planLendingHistory({
        accountFor,
        current: [],
        imported: [],
        now: NOW,
        placed: placed.placed,
        sheet: parseLendingSheet([...LENDING_SHEET, [], ...rows]),
        unmatched: placed.unmatched,
        ...extra,
      });
    };
    /** Plans `books` + `rows` after a first import of the fixture as it was. */
    const rerun = (
      books: string[][],
      rows: string[][],
      tweak: (stored: ImportedLoan[]) => ImportedLoan[] = (stored) => stored
    ) => {
      const first = planFor(LIBRARY_SHEET, []);
      return planFor(books, rows, {
        current: currentFrom(first),
        imported: tweak(importedFrom(first)),
      });
    };
    const loanIdOf = (title: string, borrower: string) => {
      const first = planFor(LIBRARY_SHEET, []);
      return (
        first.loans.findIndex(
          (loan) => loan.title === title && loan.borrower === borrower
        ) + 1
      );
    };
    const NOVEMBER_LAMPS = [
      "2026",
      "November",
      "Small Lamps",
      "Arlo",
      "Nadia",
      "extend",
    ];

    it("plans nothing when the tab didn't change", () => {
      const plan = rerun(LIBRARY_SHEET, []);
      expect(plan.updates).toEqual([]);
      expect(plan.loans).toEqual([]);
    });

    it("extends a loan the tab extends again", () => {
      const plan = rerun(LIBRARY_SHEET, [NOVEMBER_LAMPS]);
      expect(plan.loans).toEqual([]);
      expect(plan.updates).toEqual([
        expect.objectContaining({
          action: "extend",
          added: [{ dueOn: "2026-12-05", month: "2026-11" }],
          borrower: "Nadia",
          dueOn: "2026-12-05",
          extensions: 2,
          from: "2026-08",
          loanId: loanIdOf("Small Lamps", "Nadia"),
          returnedAt: null,
          title: "Small Lamps",
          to: "2026-11",
        }),
      ]);
      // Once written, a third run has nothing to do.
      const written = planFor(LIBRARY_SHEET, [NOVEMBER_LAMPS]);
      const third = planFor(LIBRARY_SHEET, [NOVEMBER_LAMPS], {
        current: currentFrom(written),
        imported: importedFrom(written),
      });
      expect(third.updates).toEqual([]);
      expect(third.loans).toEqual([]);
    });

    const OCTOBER_LOWLY = [
      "2026",
      "Oktober",
      "Lowly Paths",
      "Kai",
      "Arlo",
      "extend",
    ];

    it("reopens a returned loan the tab extends while “Lent to” names the borrower", () => {
      const plan = rerun(lentTo("Lowly Paths", "Arlo"), [OCTOBER_LOWLY]);
      expect(plan.updates).toEqual([
        expect.objectContaining({
          action: "reopen",
          added: [{ dueOn: "2026-11-07", month: "2026-10" }],
          borrower: "Arlo",
          dueOn: "2026-11-07",
          extensions: 1,
          returnedAt: null,
          title: "Lowly Paths",
        }),
      ]);
    });

    it("keeps it returned, with the new return date, when the book is out on the site", () => {
      const first = planFor(LIBRARY_SHEET, []);
      const ref =
        first.loans.find((loan) => loan.title === "Lowly Paths")?.ref ?? "";
      const plan = planFor(lentTo("Lowly Paths", "Arlo"), [OCTOBER_LOWLY], {
        current: [
          ...currentFrom(first),
          { borrowerId: "u-dara", fromLentTo: false, loanId: 99, ref },
        ],
        imported: importedFrom(first),
      });
      expect(plan.updates).toEqual([
        expect.objectContaining({
          action: "extend",
          returnedAt: new Date("2026-11-07T14:30:00.000Z"),
          title: "Lowly Paths",
        }),
      ]);
    });

    it("leaves a returned loan returned when “Lent to” doesn't name the borrower", () => {
      const plan = rerun(LIBRARY_SHEET, [
        ["2026", "Oktober", "Quiet Harbour", "Vito", "Kai", "extend"],
      ]);
      expect(plan.updates).toEqual([
        expect.objectContaining({
          action: "extend",
          added: [{ dueOn: "2026-11-07", month: "2026-10" }],
          borrower: "Kai",
          dueOn: "2026-11-07",
          extensions: 1,
          returnedAt: new Date("2026-11-07T14:30:00.000Z"),
          title: "Quiet Harbour",
        }),
      ]);
    });

    it("returns an open loan once “Lent to” no longer names the borrower", () => {
      const plan = rerun(lentTo("Small Lamps", ""), []);
      expect(plan.updates).toEqual([
        expect.objectContaining({
          action: "return",
          added: [],
          borrower: "Nadia",
          dueOn: "2026-11-07",
          extensions: 1,
          returnedAt: new Date("2026-11-07T14:30:00.000Z"),
          title: "Small Lamps",
        }),
      ]);
    });

    it("writes one month-precision line per added month", () => {
      const [extend] = rerun(LIBRARY_SHEET, [NOVEMBER_LAMPS]).updates;
      expect(extend && loanUpdateEvents(extend)).toEqual({
        added: [
          {
            at: new Date("2026-10-31T23:00:00.000Z"),
            details: {
              dueOn: "2026-12-05",
              month: "2026-11",
              precision: "month",
              source: "sheet",
            },
            type: "extended",
          },
        ],
        moveReturn: null,
      });
      const [reopen] = rerun(lentTo("Lowly Paths", "Arlo"), [
        OCTOBER_LOWLY,
      ]).updates;
      expect(reopen && loanUpdateEvents(reopen).added).toEqual([
        expect.objectContaining({
          details: expect.objectContaining({ reopened: true }),
          type: "extended",
        }),
      ]);
      const [back] = rerun(lentTo("Small Lamps", ""), []).updates;
      expect(back && loanUpdateEvents(back).added).toEqual([
        {
          at: new Date("2026-11-07T14:30:00.000Z"),
          details: { month: "2026-11", precision: "month", source: "sheet" },
          type: "returned",
        },
      ]);
      const [later] = rerun(LIBRARY_SHEET, [
        ["2026", "Oktober", "Quiet Harbour", "Vito", "Kai", "extend"],
      ]).updates;
      expect(later && loanUpdateEvents(later).moveReturn).toEqual({
        at: new Date("2026-11-07T14:30:00.000Z"),
        details: { month: "2026-11", precision: "month", source: "sheet" },
        type: "returned",
      });
    });

    it("never touches a loan returned on the site", () => {
      const lamps = loanIdOf("Small Lamps", "Nadia");
      const plan = rerun(LIBRARY_SHEET, [NOVEMBER_LAMPS], (stored) =>
        stored.map((loan) =>
          loan.loanId === lamps
            ? {
                ...loan,
                returnedAt: new Date("2026-11-01T10:00:00Z"),
                returnedById: "u-staff",
              }
            : loan
        )
      );
      expect(plan.updates).toEqual([]);
    });

    it("never updates a loan made on the site", () => {
      const first = planFor(LIBRARY_SHEET, []);
      const lamps = first.loans.find((loan) => loan.title === "Small Lamps");
      const plan = planFor(LIBRARY_SHEET, [NOVEMBER_LAMPS], {
        current: [
          {
            borrowerId: "u-nadia",
            fromLentTo: false,
            loanId: 50,
            ref: lamps?.ref ?? "",
          },
        ],
      });
      expect(plan.updates).toEqual([]);
    });
  });

  it("replaces a loan an earlier import started today, never one made on the site", () => {
    const input = inputFor(accounts("Wren", "Nadia"));
    const lantern = refOf(input, "The Lantern Case", null) ?? "";
    const replaced = planLendingHistory({
      ...input,
      current: [
        { borrowerId: "u-dara", fromLentTo: true, loanId: 7, ref: lantern },
      ],
    });
    expect(replaced.loans.find((loan) => loan.open)).toMatchObject({
      replacesLoanId: 7,
    });
    const onSite = planLendingHistory({
      ...input,
      current: [
        { borrowerId: "u-kai", fromLentTo: false, loanId: 8, ref: lantern },
      ],
    });
    expect(onSite.loans.some((loan) => loan.open)).toBe(false);
    expect(onSite.onSite).toEqual([
      expect.objectContaining({ borrower: "Dara", title: "The Lantern Case" }),
    ]);
  });

  it("leaves a loan from today only to copies the history has no open loan for", () => {
    const accountFor = accounts();
    const books = planLibraryImport({ accountFor, sheet, stored: [] });
    const plan = planLendingHistory(inputFor(accountFor));
    const lentToday = (result: ReturnType<typeof withoutCoveredLoans>) =>
      result.added
        .filter((item) => item.borrowerId)
        .map((item) => item.copy.title);
    expect(lentToday(withoutCoveredLoans(books, plan))).toEqual([]);
    const partial = {
      ...plan,
      loans: plan.loans.filter((loan) => loan.title !== "Small Lamps"),
    };
    expect(lentToday(withoutCoveredLoans(books, partial))).toEqual([
      "Small Lamps",
    ]);
  });

  it("writes month-precision history lines", () => {
    const plan = planLendingHistory(inputFor(accounts("Wren", "Nadia")));
    const kai = plan.loans.find(
      (loan) => loan.title === "The Lantern Case" && loan.borrower === "Kai"
    );
    expect(kai && sheetLoanEvents(kai)).toEqual([
      {
        at: new Date("2026-05-31T22:00:00.000Z"),
        details: {
          dueOn: "2026-07-04",
          month: "2026-06",
          precision: "month",
          source: "sheet",
        },
        type: "borrowed",
      },
      {
        at: new Date("2026-06-30T22:00:00.000Z"),
        details: {
          dueOn: "2026-08-01",
          month: "2026-07",
          precision: "month",
          source: "sheet",
        },
        type: "extended",
      },
      {
        at: new Date("2026-08-01T13:30:00.000Z"),
        details: { month: "2026-08", precision: "month", source: "sheet" },
        type: "returned",
      },
    ]);
  });
});
