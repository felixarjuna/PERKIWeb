import { createServer, type Server } from "node:http";
import {
  LENDING_SHEET,
  LIBRARY_SHEET,
} from "../src/test/fixtures/library-sheet";
import { POOL_SHEET_2026 } from "../src/test/fixtures/serving-pool-sheet";
import {
  NOTES,
  notesDoc,
  TLDRS,
  tldrDoc,
} from "../src/test/fixtures/takeaway-docs";
import { E2E_DOCS_PORT } from "./env";

/** Document ids the stand-in serves; set them in Settings to import. */
export const E2E_DOCS = { notes: "e2e-notes-doc", tldr: "e2e-tldr-doc" };

/**
 * The fixture documents moved to 2031, a year no other spec schedules, so an
 * import touches only the gatherings the import spec creates.
 */
const in2031 = (entries: typeof NOTES) =>
  entries.map((entry) => ({
    ...entry,
    heading: entry.heading.replace("2026", "2031"),
  }));

const DOCUMENTS: Record<string, string> = {
  [E2E_DOCS.notes]: notesDoc(in2031(NOTES)),
  [E2E_DOCS.tldr]: tldrDoc(in2031(TLDRS)),
};

const EXPORT_PATH = /^\/document\/d\/([\w-]+)\/export$/;

/** Sheet id the stand-in serves; set it in Settings to import. */
export const E2E_SHEET = "e2e-sheet";
export const E2E_POOL_TAB = "List Pelayan 2026";
/** Prefix of every name on the stand-in pool tab; only the import spec uses it. */
export const E2E_POOL_PREFIX = "E2E Pool";

const POOL_HEADER = 3;
/**
 * The fixture pool tab with each name prefixed, so its people are distinct
 * from every other spec's. Role columns are the odd ones; Notes follow them.
 */
const POOL_TAB = POOL_SHEET_2026.map((cells, row) =>
  row > POOL_HEADER
    ? cells.map((cell, column) =>
        column % 2 === 1 && cell ? `${E2E_POOL_PREFIX} ${cell}` : cell
      )
    : cells
);

/** The library's book list (#147); set it as the library sheet to import. */
export const E2E_LIBRARY_SHEET = "e2e-library-sheet";
export const E2E_LIBRARY_TAB = "Books";
/** Prefix of every person on the stand-in book list; only the import spec uses it. */
export const E2E_LIBRARY_PREFIX = "E2E Lib";

const OWNER_COLUMN = 7;
const LENT_TO_COLUMN = 8;
const PERKI = /^perki$/i;

/** A cell of names with each person prefixed; PERKI stays PERKI. */
const prefixed = (cell: string) =>
  cell
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => (PERKI.test(name) ? name : `${E2E_LIBRARY_PREFIX} ${name}`))
    .join(", ");

/** The fixture book list with each owner and borrower prefixed. */
const LIBRARY_TAB = LIBRARY_SHEET.map((cells, row) =>
  row === 0
    ? cells
    : cells.map((cell, column) =>
        column === OWNER_COLUMN || column === LENT_TO_COLUMN
          ? prefixed(cell)
          : cell
      )
);

/** The lending history tab (#149); Pemilik and Peminjam are prefixed. */
export const E2E_LENDING_TAB = "Peminjaman";
const PEMILIK_COLUMN = 3;
const PEMINJAM_COLUMN = 4;
const LENDING_TAB = LENDING_SHEET.map((cells, row) =>
  row === 0
    ? cells
    : cells.map((cell, column) =>
        column === PEMILIK_COLUMN || column === PEMINJAM_COLUMN
          ? prefixed(cell)
          : cell
      )
);

/**
 * The same library sheet a month later (#153): the librarian has added an
 * October `extend` row for Dara's The Lantern Case, so a rerun updates it.
 */
export const E2E_LIBRARY_SHEET_LATER = "e2e-library-sheet-later";
const LENDING_TAB_LATER = [
  ...LENDING_TAB,
  [],
  ["2026", "Oktober", "The Lantern Case", "PERKI", prefixed("Dara"), "extend"],
];

/** Each stand-in sheet: its file name and tabs. */
const SHEETS: Record<
  string,
  { tabs: Record<string, string[][]>; title: string }
> = {
  [E2E_LIBRARY_SHEET]: {
    tabs: { [E2E_LIBRARY_TAB]: LIBRARY_TAB, [E2E_LENDING_TAB]: LENDING_TAB },
    title: "E2E Library books",
  },
  [E2E_LIBRARY_SHEET_LATER]: {
    tabs: {
      [E2E_LIBRARY_TAB]: LIBRARY_TAB,
      [E2E_LENDING_TAB]: LENDING_TAB_LATER,
    },
    title: "E2E Library books, November",
  },
  [E2E_SHEET]: {
    tabs: { [E2E_POOL_TAB]: POOL_TAB },
    title: "E2E Jadwal Pelayanan",
  },
};

const SHEET_PATH = /^\/v4\/spreadsheets\/([\w-]+)(\/values\/.+)?$/;

/** Answers the Sheets API's file title, tab list and tab values for the fixtures. */
function sheetAnswer(pathname: string) {
  const match = SHEET_PATH.exec(pathname);
  const sheet = match ? SHEETS[match[1] ?? ""] : undefined;
  if (!(match && sheet)) {
    return null;
  }
  if (match[2]) {
    const range = decodeURIComponent(match[2].slice("/values/".length));
    const tab = Object.entries(sheet.tabs).find(
      ([title]) => range === `'${title}'`
    );
    return tab ? { values: tab[1] } : null;
  }
  return {
    properties: { title: sheet.title },
    sheets: Object.keys(sheet.tabs).map((title) => ({ properties: { title } })),
  };
}

/** Answers Google Docs' HTML export URL and the Sheets API for the fixtures. */
export const startDocsServer = () =>
  new Promise<Server>((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", "http://localhost");
      const sheet = sheetAnswer(url.pathname);
      if (sheet) {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(sheet));
        return;
      }
      const html = DOCUMENTS[EXPORT_PATH.exec(url.pathname)?.[1] ?? ""];
      response.writeHead(html ? 200 : 404, {
        "content-type": "text/html; charset=utf-8",
      });
      response.end(html ?? "Not found");
    });
    server.once("error", reject);
    server.listen(E2E_DOCS_PORT, "127.0.0.1", () => resolve(server));
  });
