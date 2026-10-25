import { createServer, type Server } from "node:http";
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

const SHEET_PATH = new RegExp(`^/v4/spreadsheets/${E2E_SHEET}(/values/.+)?$`);

/** Answers the Sheets API's tab list and tab values for the fixture sheet. */
function sheetAnswer(pathname: string) {
  const match = SHEET_PATH.exec(pathname);
  if (!match) {
    return null;
  }
  if (match[1]) {
    const range = decodeURIComponent(match[1].slice("/values/".length));
    return range === `'${E2E_POOL_TAB}'` ? { values: POOL_TAB } : null;
  }
  return {
    properties: { title: "E2E Jadwal Pelayanan" },
    sheets: [{ properties: { title: E2E_POOL_TAB } }],
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
