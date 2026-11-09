import { DateTime } from "luxon";
import {
  type BookFormat,
  type LanguageCode,
  MAX_AUTHOR,
  MAX_CATEGORY,
  MAX_DESCRIPTION,
  MAX_PUBLISHER,
  MAX_TITLE,
} from "./library";
import { startOn } from "./schedule-team";

/**
 * "Import from sheet" for the library (#147): reads the book list's first tab
 * (columns found by header name) and plans what importing it would do. One
 * row can stand for several copies: one per owner, per format and per
 * language. Nothing here touches the database.
 */

/** One copy of a book, as a sheet row describes it. */
export interface SheetCopy {
  author: string;
  category: string | null;
  description: string | null;
  format: BookFormat;
  language: LanguageCode | null;
  /** "Lent to" for the row's first physical copy, as written; else null. */
  lentTo: string | null;
  /** The owner as written; null when PERKI owns it. */
  owner: string | null;
  publisher: string | null;
  /** Sheet row number (1-based) for messages. */
  row: number;
  title: string;
}

export interface SkippedRow {
  reason: string;
  row: number;
  title: string;
}

export interface UnknownLanguage {
  row: number;
  title: string;
  value: string;
}

export interface LibrarySheet {
  copies: SheetCopy[];
  skipped: SkippedRow[];
  unknownLanguages: UnknownLanguage[];
}

const COLUMNS = {
  author: "author",
  category: "category",
  language: "language",
  lentTo: "lent to",
  notes: "notes",
  owner: "owner",
  publisher: "publisher",
  title: "title",
  type: "type",
} as const;
type Column = keyof typeof COLUMNS;

const WHITESPACE = /\s+/g;
const LIST_SEPARATOR = /[,/&]|\band\b/i;
const URL_ONLY = /^https?:\/\/\S+$/i;
const SMALL_WORDS = new Set(["a", "an", "and", "for", "in", "of", "on", "the"]);
const PERKI = "perki";

const tidy = (value: string | undefined) =>
  (value ?? "").replace(WHITESPACE, " ").trim();
const key = (value: string) => tidy(value).toLowerCase().replaceAll("’", "'");
const list = (value: string) =>
  tidy(value).split(LIST_SEPARATOR).map(tidy).filter(Boolean);
const clip = (value: string, max: number) => value.slice(0, max).trim();
const orNull = (value: string, max: number) => clip(value, max) || null;

const LANGUAGES: Record<string, LanguageCode> = {
  bahasa: "id",
  "bahasa indonesia": "id",
  de: "de",
  deutsch: "de",
  en: "en",
  english: "en",
  german: "de",
  id: "id",
  indo: "id",
  indonesia: "id",
  indonesian: "id",
};

const FORMATS: Record<string, BookFormat> = {
  buku: "physical",
  "e-book": "ebook",
  ebook: "ebook",
  fisik: "physical",
  physical: "physical",
};

/** The spellings the sheet uses for one category, and the one we keep. */
const CATEGORIES: Record<string, string> = {
  apologetic: "Apologetics",
  relationship: "Relationships",
  "women's book": "Women",
  "women's books": "Women",
};

const PUBLISHERS: Record<string, string> = {
  "crossway books": "Crossway",
};

/** "Apologetic" → "Apologetics"; otherwise trimmed, as written. */
export function normaliseCategory(value: string): string | null {
  const written = tidy(value);
  if (!written) {
    return null;
  }
  return clip(CATEGORIES[key(written)] ?? written, MAX_CATEGORY);
}

/** "Crossway Books" → "Crossway", "Banner Of Truth" → "Banner of Truth". */
export function normalisePublisher(value: string): string | null {
  const written = tidy(value);
  if (!written) {
    return null;
  }
  const known = PUBLISHERS[key(written)];
  if (known) {
    return known;
  }
  const words = written
    .split(" ")
    .map((word, index) =>
      index > 0 && SMALL_WORDS.has(word.toLowerCase())
        ? word.toLowerCase()
        : word
    );
  return clip(words.join(" "), MAX_PUBLISHER);
}

/** The owners a cell names; PERKI (or nobody) is `null`. */
function ownersOf(value: string): (string | null)[] {
  const people = list(value).filter((name) => key(name) !== PERKI);
  const unique = [...new Map(people.map((name) => [key(name), name])).values()];
  return unique.length > 0 ? unique : [null];
}

function formatsOf(value: string): BookFormat[] {
  const formats = new Set(
    list(value).map((part) => FORMATS[key(part)] ?? "physical")
  );
  return formats.size > 0 ? [...formats] : ["physical"];
}

function languagesOf(value: string) {
  const known = new Set<LanguageCode>();
  const unknown: string[] = [];
  for (const part of list(value)) {
    const code = LANGUAGES[key(part)];
    if (code) {
      known.add(code);
    } else {
      unknown.push(part);
    }
  }
  return {
    codes: known.size > 0 ? [...known] : [null],
    unknown,
  };
}

/** The header row: the first one naming both Title and Author. */
function findHeader(values: string[][]) {
  const index = values.findIndex((cells) => {
    const keys = cells.map(key);
    return keys.includes(COLUMNS.title) && keys.includes(COLUMNS.author);
  });
  if (index === -1) {
    return null;
  }
  const columns = new Map<Column, number>();
  const keys = (values[index] ?? []).map(key);
  for (const [name, header] of Object.entries(COLUMNS)) {
    const column = keys.indexOf(header);
    if (column !== -1) {
      columns.set(name as Column, column);
    }
  }
  return { columns, index };
}

/** Why a row isn't a book to import, or null when it is. */
function skipReason(cell: (name: Column) => string): string | null {
  const notes = cell("notes");
  if (key(cell("title")) === "free christian books") {
    return "A link to free books, not a book";
  }
  if (
    URL_ONLY.test(notes) &&
    (!cell("author") || key(cell("author")).startsWith("misc"))
  ) {
    return "Only a link, without an author";
  }
  if (!cell("author")) {
    return "No author";
  }
  return null;
}

/**
 * Reads the book list. Blank rows and rows without a title are left out
 * silently; link rows ("Free Christian Books") and rows without an author are
 * listed as skipped.
 */
export function parseLibrarySheet(values: string[][]): LibrarySheet {
  const sheet: LibrarySheet = { copies: [], skipped: [], unknownLanguages: [] };
  const header = findHeader(values);
  if (!header) {
    return sheet;
  }
  for (const [offset, cells] of values.slice(header.index + 1).entries()) {
    const row = header.index + offset + 2;
    const cell = (name: Column) => {
      const column = header.columns.get(name);
      return column === undefined ? "" : tidy(cells[column]);
    };
    const title = clip(cell("title"), MAX_TITLE);
    if (!title) {
      continue;
    }
    const reason = skipReason(cell);
    if (reason) {
      sheet.skipped.push({ reason, row, title });
      continue;
    }
    const languages = languagesOf(cell("language"));
    for (const value of languages.unknown) {
      sheet.unknownLanguages.push({ row, title, value });
    }
    sheet.copies.push(...copiesOfRow(cell, row, title, languages.codes));
  }
  return sheet;
}

/** A row's copies: one per owner, per format and per language. */
function copiesOfRow(
  cell: (name: Column) => string,
  row: number,
  title: string,
  languages: (LanguageCode | null)[]
): SheetCopy[] {
  const base = {
    author: clip(cell("author"), MAX_AUTHOR),
    category: normaliseCategory(cell("category")),
    description: orNull(cell("notes"), MAX_DESCRIPTION),
    publisher: normalisePublisher(cell("publisher")),
    row,
    title,
  };
  const copies = ownersOf(cell("owner")).flatMap((owner) =>
    formatsOf(cell("type")).flatMap((format) =>
      languages.map((language) => ({
        ...base,
        format,
        language,
        lentTo: null as string | null,
        owner,
      }))
    )
  );
  // "Lent to" names one person, so it goes with the row's first physical copy.
  const lent = copies.find((copy) => copy.format === "physical");
  if (lent) {
    lent.lentTo = cell("lentTo") || null;
  }
  return copies;
}

/** A book already in the library, as the plan compares it. */
export interface StoredBook {
  author: string;
  category: string | null;
  description: string | null;
  format: string;
  id: number;
  language: string | null;
  /** Never lent and free on the shelf, so a "Lent to" may start its loan. */
  lendable: boolean;
  ownerId: string | null;
  publisher: string | null;
  title: string;
}

/** The fields an import may fill in on a stored book; it never clears one. */
export const IMPORTED_FIELDS = [
  "publisher",
  "category",
  "language",
  "description",
] as const;
export type ImportedField = (typeof IMPORTED_FIELDS)[number];

export interface FieldChange {
  field: ImportedField;
  from: string | null;
  to: string;
}

export interface PlannedCopy {
  /** The loan to start for this copy's "Lent to", when their account is known. */
  borrowerId: string | null;
  copy: SheetCopy;
  ownerId: string | null;
}

/**
 * A copy the book list places, for the lending history to find: `ref` is
 * `id:<book id>` for a stored book, `new:<index in added>` for a new one.
 */
export interface PlacedCopy {
  format: BookFormat;
  /** The account "Lent to" names, whether or not a loan would start. */
  lentToId: string | null;
  ownerId: string | null;
  ref: string;
  title: string;
}

export type UnmatchedUse = "owner" | "borrower";

export interface UnmatchedName {
  as: UnmatchedUse[];
  /** Rows of the lending history tab ("Peminjaman") that name them. */
  lendingRows: number[];
  name: string;
  /** Rows of the book list that name them. */
  rows: number[];
}

export interface LibraryImportPlan {
  added: PlannedCopy[];
  changed: (PlannedCopy & { changes: FieldChange[]; id: number })[];
  /** Copies whose owner has no account yet: skipped until the name is linked. */
  ownerUnlinked: SheetCopy[];
  /** Every copy placed in the library (new or stored), for the lending history. */
  placed: PlacedCopy[];
  skipped: SkippedRow[];
  unchanged: number;
  unknownLanguages: UnknownLanguage[];
  /** Copies imported without their loan, since "Lent to" has no account. */
  unlinkedLoans: SheetCopy[];
  /** Names that match no account, with how and where the sheet uses them. */
  unmatched: UnmatchedName[];
}

/** Notes a name without an account, once per name, with each use and row. */
function addUnmatched(
  names: UnmatchedName[],
  name: string,
  as: UnmatchedUse,
  row: number,
  tab: "rows" | "lendingRows" = "rows"
) {
  let found = names.find((item) => key(item.name) === key(name));
  if (!found) {
    found = { as: [], lendingRows: [], name, rows: [] };
    names.push(found);
  }
  if (!found.as.includes(as)) {
    found.as.push(as);
  }
  if (!found[tab].includes(row)) {
    found[tab].push(row);
  }
}

const bookKey = (
  book: { author: string; format: string; title: string },
  ownerId: string | null
) =>
  [key(book.title), key(book.author), ownerId ?? PERKI, book.format].join(
    "\u0000"
  );

/**
 * The stored book a copy is: one with the same title, author, owner and
 * format, preferring the same language, then one without a language.
 */
function matchStored(
  candidates: StoredBook[] | undefined,
  used: Set<number>,
  language: string | null
) {
  const free = (candidates ?? []).filter((book) => !used.has(book.id));
  return (
    free.find((book) => book.language === language) ??
    free.find((book) => book.language === null) ??
    (language === null ? free[0] : undefined)
  );
}

function changesOf(copy: SheetCopy, stored: StoredBook): FieldChange[] {
  return IMPORTED_FIELDS.flatMap((field) => {
    const to = copy[field];
    return to !== null && to !== stored[field]
      ? [{ field, from: stored[field], to }]
      : [];
  });
}

/**
 * What importing the sheet would do: new copies, stored books the sheet adds
 * details to (it never clears one), copies already up to date, and names
 * without an account. A copy whose owner isn't linked waits, so no book loses
 * its lender; a "Lent to" without an account imports the book without its
 * loan. A loan is only started on a book that was never lent.
 */
export function planLibraryImport({
  accountFor,
  sheet,
  stored,
}: {
  accountFor: (name: string) => string | undefined;
  sheet: LibrarySheet;
  stored: readonly StoredBook[];
}): LibraryImportPlan {
  const plan: LibraryImportPlan = {
    added: [],
    changed: [],
    ownerUnlinked: [],
    placed: [],
    skipped: sheet.skipped,
    unchanged: 0,
    unknownLanguages: sheet.unknownLanguages,
    unlinkedLoans: [],
    unmatched: [],
  };
  const unmatched = (name: string, as: UnmatchedUse, row: number) =>
    addUnmatched(plan.unmatched, name, as, row);
  const byKey = new Map<string, StoredBook[]>();
  for (const book of stored) {
    const bookKeyed = bookKey(book, book.ownerId);
    byKey.set(bookKeyed, [...(byKey.get(bookKeyed) ?? []), book]);
  }
  const used = new Set<number>();

  for (const copy of sheet.copies) {
    const ownerId = copy.owner ? (accountFor(copy.owner) ?? null) : null;
    if (copy.owner && !ownerId) {
      unmatched(copy.owner, "owner", copy.row);
      plan.ownerUnlinked.push(copy);
      continue;
    }
    const borrowerId = copy.lentTo ? (accountFor(copy.lentTo) ?? null) : null;
    if (copy.lentTo && !borrowerId) {
      unmatched(copy.lentTo, "borrower", copy.row);
      plan.unlinkedLoans.push(copy);
    }
    const match = matchStored(
      byKey.get(bookKey(copy, ownerId)),
      used,
      copy.language
    );
    const place = (ref: string) =>
      plan.placed.push({
        format: copy.format,
        lentToId: borrowerId,
        ownerId,
        ref,
        title: copy.title,
      });
    if (!match) {
      place(`new:${plan.added.length}`);
      plan.added.push({ borrowerId, copy, ownerId });
      continue;
    }
    used.add(match.id);
    place(`id:${match.id}`);
    compareWithStored(plan, { borrowerId, copy, ownerId }, match);
  }
  return plan;
}

/** A copy that is a stored book: changed when it adds a detail or a loan. */
function compareWithStored(
  plan: LibraryImportPlan,
  planned: PlannedCopy,
  match: StoredBook
) {
  const changes = changesOf(planned.copy, match);
  const loan = match.lendable ? planned.borrowerId : null;
  if (changes.length > 0 || loan) {
    plan.changed.push({ ...planned, borrowerId: loan, changes, id: match.id });
  } else {
    plan.unchanged += 1;
  }
}

/*
 * The lending history (#149): the sheet's "Peminjaman" tab lists every lend,
 * one row per book per month it was out. It knows the month only, never the
 * day, so the dates below follow the owner's rule: a book is lent on the 1st
 * of its first month and due back at the gathering on the first Saturday of
 * the month after the last month it's listed.
 */

/** The lending history tab's name, compared without case. */
export const LENDING_TAB = "peminjaman";

const ZONE = "Europe/Berlin";
const EXTEND = "extend";
const SATURDAY = 6;
const DAYS_IN_WEEK = 7;
const LAST_MONTH = 12;

const LENDING_COLUMNS = {
  borrower: "peminjam",
  month: "bulan",
  note: "catatan",
  owner: "pemilik",
  title: "title",
  year: "tahun",
} as const;
type LendingColumn = keyof typeof LENDING_COLUMNS;

/** Month names as the sheet may write them: Indonesian, English, German. */
const MONTHS: Record<string, number> = {
  agu: 8,
  agustus: 8,
  apr: 4,
  april: 4,
  aug: 8,
  august: 8,
  dec: 12,
  december: 12,
  des: 12,
  desember: 12,
  dez: 12,
  dezember: 12,
  feb: 2,
  februar: 2,
  februari: 2,
  february: 2,
  jan: 1,
  januar: 1,
  januari: 1,
  january: 1,
  jul: 7,
  juli: 7,
  july: 7,
  jun: 6,
  june: 6,
  juni: 6,
  mai: 5,
  mar: 3,
  march: 3,
  maret: 3,
  may: 5,
  mei: 5,
  märz: 3,
  nov: 11,
  november: 11,
  oct: 10,
  october: 10,
  okt: 10,
  oktober: 10,
  sep: 9,
  sept: 9,
  september: 9,
};

const firstOf = (month: string) =>
  DateTime.fromISO(`${month}-01`, { zone: ZONE });

/**
 * The day a book listed last in `month` (`yyyy-MM`) is due back: the
 * gathering on the first Saturday of the month after it, as `yyyy-MM-dd`.
 */
export function firstSaturdayOfNextMonth(month: string): string {
  const next = firstOf(month).plus({ months: 1 });
  // Luxon counts Monday as 1, so Saturday is 6.
  const days = (SATURDAY - next.weekday + DAYS_IN_WEEK) % DAYS_IN_WEEK;
  return next.plus({ days }).toISODate() ?? "";
}

/** "2026-07" → "July 2026". */
export const monthLabel = (month: string) =>
  firstOf(month).setLocale("en-GB").toFormat("LLLL yyyy");

/** The month a row's Tahun and Bulan name, as `yyyy-MM`, or null. */
export function sheetMonth(year: string, month: string): string | null {
  const yearNumber = Number.parseInt(tidy(year), 10);
  const written = key(month).replace(".", "");
  const monthNumber = MONTHS[written] ?? Number.parseInt(written, 10);
  if (
    !(Number.isInteger(yearNumber) && Number.isInteger(monthNumber)) ||
    monthNumber < 1 ||
    monthNumber > LAST_MONTH
  ) {
    return null;
  }
  return `${yearNumber}-${String(monthNumber).padStart(2, "0")}`;
}

/** One row of the lending history: a book out to someone in one month. */
export interface LendingRow {
  borrower: string;
  /** "extend": the same borrower kept the book another month. */
  extend: boolean;
  /** `yyyy-MM`. */
  month: string;
  /** As written; null when PERKI owns it. */
  owner: string | null;
  row: number;
  title: string;
}

export interface LendingSheet {
  rows: LendingRow[];
  skipped: SkippedRow[];
}

function findLendingHeader(values: string[][]) {
  const index = values.findIndex((cells) => {
    const keys = cells.map(key);
    return (
      keys.includes(LENDING_COLUMNS.title) &&
      keys.includes(LENDING_COLUMNS.borrower)
    );
  });
  if (index === -1) {
    return null;
  }
  const keys = (values[index] ?? []).map(key);
  const columns = new Map<LendingColumn, number>();
  for (const [name, header] of Object.entries(LENDING_COLUMNS)) {
    const column = keys.indexOf(header);
    if (column !== -1) {
      columns.set(name as LendingColumn, column);
    }
  }
  return { columns, index };
}

function lendingSkipReason(year: string, month: string, borrower: string) {
  if (!sheetMonth(year, month)) {
    return month ? `Unknown month “${month}”` : "No month";
  }
  return borrower ? null : "No borrower";
}

/**
 * Reads the lending history. Tahun and Bulan are written once per month and
 * carry down; empty rows between months are left out. A row without a month
 * or a borrower is listed as skipped.
 */
export function parseLendingSheet(values: string[][]): LendingSheet {
  const sheet: LendingSheet = { rows: [], skipped: [] };
  const header = findLendingHeader(values);
  if (!header) {
    return sheet;
  }
  let year = "";
  let month = "";
  for (const [offset, cells] of values.slice(header.index + 1).entries()) {
    const row = header.index + offset + 2;
    const cell = (name: LendingColumn) => {
      const column = header.columns.get(name);
      return column === undefined ? "" : tidy(cells[column]);
    };
    year = cell("year") || year;
    month = cell("month") || month;
    const title = clip(cell("title"), MAX_TITLE);
    if (!title) {
      continue;
    }
    const reason = lendingSkipReason(year, month, cell("borrower"));
    if (reason) {
      sheet.skipped.push({ reason, row, title });
      continue;
    }
    const owner = cell("owner");
    sheet.rows.push({
      borrower: cell("borrower"),
      extend: key(cell("note")) === EXTEND,
      month: sheetMonth(year, month) ?? "",
      owner: owner && key(owner) !== PERKI ? owner : null,
      row,
      title,
    });
  }
  return sheet;
}

/** A loan the history tab describes, with the dates the owner's rule gives. */
export interface PlannedLoan {
  /** The 1st of the first month, in Aachen. */
  borrowedAt: Date;
  /** As the sheet writes them. */
  borrower: string;
  borrowerId: string;
  /** The due date after every extension. */
  dueOn: string;
  /** One per `extend` row, in order: its month and the due date it sets. */
  extended: { dueOn: string; month: string }[];
  /** First month listed, `yyyy-MM`. */
  from: string;
  /** Open when the book list's "Lent to" still names the borrower. */
  open: boolean;
  /** The book: a `PlacedCopy` ref. */
  ref: string;
  /** The loan an earlier import started today from "Lent to", replaced by this. */
  replacesLoanId: number | null;
  returnedAt: Date | null;
  rows: number[];
  title: string;
  /** Last month listed, `yyyy-MM`. */
  to: string;
}

/** A loan an earlier import already took from the history tab. */
export interface ImportedLoan {
  borrowerId: string;
  /** The month it started, `yyyy-MM`. */
  month: string;
  ref: string;
}

/** A book's open loan in the library now. */
export interface CurrentLoan {
  borrowerId: string;
  /** Started by an earlier import from "Lent to", so lent "today" as a guess. */
  fromLentTo: boolean;
  loanId: number;
  ref: string;
}

/** A history row that can't be placed, with why. */
export interface LendingRowIssue {
  reason: string;
  row: number;
  title: string;
}

export interface LendingPlan {
  /** Loans an earlier import already wrote. */
  imported: number;
  /** Loans to write. */
  loans: PlannedLoan[];
  /** Open loans left out because the book is already out on the site. */
  onSite: PlannedLoan[];
  /** Rows that can't be placed yet: no such copy, or a name without an account. */
  problems: LendingRowIssue[];
  skipped: SkippedRow[];
  /** `extend` rows with no earlier lend to that borrower, counted as a lend. */
  unmatchedExtends: LendingRowIssue[];
}

export interface LendingInput {
  accountFor: (name: string) => string | undefined;
  /** Today's open loans, by book. */
  current: readonly CurrentLoan[];
  /** Already written by an earlier import, matched on book, borrower and month. */
  imported: readonly ImportedLoan[];
  now: Date;
  /** The copies the book list places (`LibraryImportPlan.placed`). */
  placed: readonly PlacedCopy[];
  sheet: LendingSheet;
  /** The book list's names without an account; the history's are added. */
  unmatched: UnmatchedName[];
}

/**
 * The copy a history row is about: the only physical copy with that title,
 * else the owner's, preferring the one "Lent to" names the borrower on.
 */
function copyForRow(
  input: LendingInput,
  row: LendingRow,
  borrowerId: string
): PlacedCopy | LendingRowIssue {
  const copies = input.placed.filter(
    (copy) => copy.format === "physical" && key(copy.title) === key(row.title)
  );
  const issue = (reason: string) => ({
    reason,
    row: row.row,
    title: row.title,
  });
  if (copies.length === 0) {
    return issue("No copy with this title in the book list");
  }
  const [only] = copies;
  if (copies.length === 1 && only) {
    return only;
  }
  const ownerId = row.owner ? (input.accountFor(row.owner) ?? null) : null;
  if (row.owner && !ownerId) {
    addUnmatched(input.unmatched, row.owner, "owner", row.row, "lendingRows");
    return issue(`Owner ${row.owner} has no account yet`);
  }
  const owned = copies.filter((copy) => copy.ownerId === ownerId);
  const pick =
    owned.find((copy) => copy.lentToId === borrowerId) ?? owned.at(0);
  return pick ?? issue(`No copy is ${row.owner ?? "PERKI"}'s`);
}

/** A new loan from a row; `settleDates` decides open or returned. */
const newLoan = (
  row: LendingRow,
  copy: PlacedCopy,
  borrowerId: string
): PlannedLoan => ({
  borrowedAt: firstOf(row.month).toJSDate(),
  borrower: row.borrower,
  borrowerId,
  dueOn: firstSaturdayOfNextMonth(row.month),
  extended: [],
  from: row.month,
  open: false,
  ref: copy.ref,
  replacesLoanId: null,
  returnedAt: null,
  rows: [row.row],
  title: copy.title,
  to: row.month,
});

/** 15:30 in Aachen on a `yyyy-MM-dd` day: the gathering a book comes back at. */
const gatheringOn = (day: string) => {
  const date = DateTime.fromISO(day, { zone: ZONE });
  return startOn({ day: date.day, month: date.month, year: date.year });
};

/** The loan an `extend` row continues: the same title and borrower, earlier. */
const continued = (
  loans: PlannedLoan[],
  row: LendingRow,
  borrowerId: string
) =>
  row.extend
    ? loans.findLast(
        (loan) =>
          loan.borrowerId === borrowerId &&
          key(loan.title) === key(row.title) &&
          loan.to < row.month
      )
    : undefined;

function extend(loan: PlannedLoan, row: LendingRow) {
  const dueOn = firstSaturdayOfNextMonth(row.month);
  loan.extended.push({ dueOn, month: row.month });
  loan.dueOn = dueOn;
  loan.to = row.month;
  loan.rows.push(row.row);
}

/** Builds every loan the rows describe, in month order. */
function loansFromRows(input: LendingInput, plan: LendingPlan) {
  const loans: PlannedLoan[] = [];
  const rows = [...input.sheet.rows].sort(
    (a, b) => a.month.localeCompare(b.month) || a.row - b.row
  );
  for (const row of rows) {
    const borrowerId = input.accountFor(row.borrower);
    if (!borrowerId) {
      addUnmatched(
        input.unmatched,
        row.borrower,
        "borrower",
        row.row,
        "lendingRows"
      );
      plan.problems.push({
        reason: `Borrower ${row.borrower} has no account yet`,
        row: row.row,
        title: row.title,
      });
      continue;
    }
    const earlier = continued(loans, row, borrowerId);
    if (earlier) {
      extend(earlier, row);
      continue;
    }
    const copy = copyForRow(input, row, borrowerId);
    if (!("ref" in copy)) {
      plan.problems.push(copy);
      continue;
    }
    if (row.extend) {
      plan.unmatchedExtends.push({
        reason: `Extended for ${row.borrower} without an earlier lend, so counted as a lend`,
        row: row.row,
        title: row.title,
      });
    }
    loans.push(newLoan(row, copy, borrowerId));
  }
  return loans;
}

/**
 * Open loans: per copy, the latest loan to the person "Lent to" still names.
 * Every other loan came back at the gathering on its due date (never later
 * than now, for a month that isn't over yet).
 */
function settleDates(
  loans: PlannedLoan[],
  placed: readonly PlacedCopy[],
  now: Date
) {
  for (const copy of placed) {
    const open = copy.lentToId
      ? loans.findLast(
          (loan) => loan.ref === copy.ref && loan.borrowerId === copy.lentToId
        )
      : undefined;
    if (open) {
      open.open = true;
    }
  }
  for (const loan of loans) {
    if (!loan.open) {
      const back = gatheringOn(loan.dueOn);
      loan.returnedAt = back > now ? now : back;
    }
  }
}

/**
 * What importing the lending history would write. A loan already imported
 * (same book, borrower and first month) is counted, not written again. An
 * open loan replaces the loan an earlier import started today from "Lent to"
 * for the same borrower, and is left out when the book is out on the site
 * otherwise, since a loan made on the site is left alone.
 */
export function planLendingHistory(input: LendingInput): LendingPlan {
  const plan: LendingPlan = {
    imported: 0,
    loans: [],
    onSite: [],
    problems: [],
    skipped: input.sheet.skipped,
    unmatchedExtends: [],
  };
  const loans = loansFromRows(input, plan);
  settleDates(loans, input.placed, input.now);
  for (const loan of loans) {
    const done = input.imported.some(
      (item) =>
        item.ref === loan.ref &&
        item.borrowerId === loan.borrowerId &&
        item.month === loan.from
    );
    if (done) {
      plan.imported += 1;
      continue;
    }
    const current = loan.open
      ? input.current.find((item) => item.ref === loan.ref)
      : undefined;
    if (!current) {
      plan.loans.push(loan);
    } else if (current.fromLentTo && current.borrowerId === loan.borrowerId) {
      plan.loans.push({ ...loan, replacesLoanId: current.loanId });
    } else {
      plan.onSite.push(loan);
    }
  }
  return plan;
}

/**
 * The book list's "Lent to" starts a loan today only when the history has no
 * open loan for that copy: the history knows when it really started.
 */
export function withoutCoveredLoans(
  plan: LibraryImportPlan,
  lending: LendingPlan
): LibraryImportPlan {
  const covered = new Set(
    lending.loans.filter((loan) => loan.open).map((loan) => loan.ref)
  );
  const changed = plan.changed.map((item) =>
    covered.has(`id:${item.id}`) ? { ...item, borrowerId: null } : item
  );
  const stillChanged = changed.filter(
    (item) => item.changes.length > 0 || item.borrowerId
  );
  return {
    ...plan,
    added: plan.added.map((item, index) =>
      covered.has(`new:${index}`) ? { ...item, borrowerId: null } : item
    ),
    changed: stillChanged,
    unchanged: plan.unchanged + changed.length - stillChanged.length,
  };
}

/** One history line a loan from the sheet writes. */
export interface SheetLoanEvent {
  at: Date;
  details: Record<string, unknown>;
  type: "borrowed" | "extended" | "returned";
}

const fromSheet = (month: string) => ({
  month,
  precision: "month",
  source: "sheet",
});

/**
 * The history lines of a loan from the sheet, each marked `source: "sheet"`
 * and `precision: "month"`, since the sheet never says the day.
 */
export function sheetLoanEvents(loan: PlannedLoan): SheetLoanEvent[] {
  const events: SheetLoanEvent[] = [
    {
      at: loan.borrowedAt,
      details: {
        ...fromSheet(loan.from),
        dueOn: firstSaturdayOfNextMonth(loan.from),
      },
      type: "borrowed",
    },
    ...loan.extended.map(
      (extension): SheetLoanEvent => ({
        at: firstOf(extension.month).toJSDate(),
        details: { ...fromSheet(extension.month), dueOn: extension.dueOn },
        type: "extended",
      })
    ),
  ];
  if (loan.returnedAt) {
    events.push({
      at: loan.returnedAt,
      details: fromSheet(
        DateTime.fromJSDate(loan.returnedAt).setZone(ZONE).toFormat("yyyy-MM")
      ),
      type: "returned",
    });
  }
  return events;
}
