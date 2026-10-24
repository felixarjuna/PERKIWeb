import { createServer, type Server } from "node:http";
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

/** Answers Google Docs' HTML export URL for the fixture documents. */
export const startDocsServer = () =>
  new Promise<Server>((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", "http://localhost");
      const html = DOCUMENTS[EXPORT_PATH.exec(url.pathname)?.[1] ?? ""];
      response.writeHead(html ? 200 : 404, {
        "content-type": "text/html; charset=utf-8",
      });
      response.end(html ?? "Not found");
    });
    server.once("error", reject);
    server.listen(E2E_DOCS_PORT, "127.0.0.1", () => resolve(server));
  });
