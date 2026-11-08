import {
  type BookFormat,
  type LanguageCode,
  MAX_AUTHOR,
  MAX_CATEGORY,
  MAX_DESCRIPTION,
  MAX_PUBLISHER,
  MAX_TITLE,
} from "./library";

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

export interface LibraryImportPlan {
  added: PlannedCopy[];
  changed: (PlannedCopy & { changes: FieldChange[]; id: number })[];
  /** Copies whose owner has no account yet: skipped until the name is linked. */
  ownerUnlinked: SheetCopy[];
  skipped: SkippedRow[];
  unchanged: number;
  unknownLanguages: UnknownLanguage[];
  /** Copies imported without their loan, since "Lent to" has no account. */
  unlinkedLoans: SheetCopy[];
  /** Names that match no account, with how and where the sheet uses them. */
  unmatched: { as: ("owner" | "borrower")[]; name: string; rows: number[] }[];
}

/** Notes a name without an account, once per name, with each use and row. */
function addUnmatched(
  names: LibraryImportPlan["unmatched"],
  name: string,
  as: "owner" | "borrower",
  row: number
) {
  const found = names.find((item) => key(item.name) === key(name));
  if (!found) {
    names.push({ as: [as], name, rows: [row] });
    return;
  }
  if (!found.as.includes(as)) {
    found.as.push(as);
  }
  if (!found.rows.includes(row)) {
    found.rows.push(row);
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
    skipped: sheet.skipped,
    unchanged: 0,
    unknownLanguages: sheet.unknownLanguages,
    unlinkedLoans: [],
    unmatched: [],
  };
  const unmatched = (name: string, as: "owner" | "borrower", row: number) =>
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
    if (!match) {
      plan.added.push({ borrowerId, copy, ownerId });
      continue;
    }
    used.add(match.id);
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
