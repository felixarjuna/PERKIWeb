/** Local-only archival import. Run without --apply first; see docs/takeaway-import.md. */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { config } from "dotenv";
import postgres from "postgres";
import {
  assertLocalImportDatabase,
  type ImportPlanRow,
  pairTakeawaySources,
  parseTakeawaySource,
  planTakeawayImport,
} from "../src/lib/takeaway-import";

config({ quiet: true });
const { values } = parseArgs({
  options: {
    apply: { default: false, type: "boolean" },
    corrections: { type: "string" },
    notes: { type: "string" },
    report: { type: "string" },
    tldr: { type: "string" },
  },
});
const databaseUrl = process.env.DATABASE_URL;
if (!(databaseUrl && values.notes && values.tldr && values.report)) {
  throw new Error(
    "Set DATABASE_URL and supply --notes, --tldr and --report paths."
  );
}
assertLocalImportDatabase(databaseUrl);
const [notesHtml, tldrHtml] = await Promise.all([
  readFile(values.notes, "utf8"),
  readFile(values.tldr, "utf8"),
]);
const notes = parseTakeawaySource(notesHtml);
const tldr = parseTakeawaySource(tldrHtml);
const corrections: Record<string, string> = values.corrections
  ? JSON.parse(await readFile(values.corrections, "utf8"))
  : {};
const pairs = pairTakeawaySources(notes, tldr, corrections);
const sql = postgres(databaseUrl, {
  connection: { default_transaction_read_only: !values.apply },
  max: 1,
});

function reportMarkdown(plan: ImportPlanRow[]) {
  const hash = (text: string) =>
    createHash("sha256").update(text).digest("hex");
  const rows = plan.map(
    (row) =>
      `| ${row.date} | ${row.scheduleId ?? "—"} | ${row.action} | ${row.reason} |`
  );
  const sections = plan.map(
    (row) =>
      `## ${row.date}\n\nOriginal notes date: ${row.notes.date}. Original TL;DR date: ${row.tldr.date}.\n\n### Full notes\n\n${row.notes.content}\n\n### TL;DR\n\n${row.tldr.content}`
  );
  return [
    "# Local takeaway import review",
    `Target: localhost:54320/perkiweb_dev. Mode: ${values.apply ? "apply" : "preview"}.`,
    "Imported records are unpublished drafts with no inferred author or contributor. Existing content is never overwritten.",
    `Notes SHA-256: ${hash(notesHtml)}\n\nTL;DR SHA-256: ${hash(tldrHtml)}`,
    `Explicit source-date mappings: ${JSON.stringify(corrections)}`,
    [
      "| Gathering date | Schedule ID | Action | Reason |",
      "| --- | --- | --- | --- |",
      ...rows,
    ].join("\n"),
    "## Source instructions (not imported as takeaway content)",
    notes.instructions || "No notes preamble.",
    tldr.instructions || "No TL;DR preamble.",
    ...sections,
  ].join("\n\n");
}

try {
  await sql.begin(async (transaction) => {
    if (values.apply) {
      // Recheck under the same lock as the write: parallel imports cannot duplicate rows.
      await transaction`lock table schedules, takeaways in share row exclusive mode`;
    }
    const schedules = await transaction<{ id: number; date: string }[]>`
      select id, to_char(date at time zone 'Europe/Berlin', 'YYYY-MM-DD') as date
      from schedules
    `;
    const existing = await transaction<
      {
        id: number;
        scheduleId: number;
        keypoints: string;
        tldr: string | null;
      }[]
    >`select id, "scheduleId", keypoints, tldr from takeaways`;
    const plan = planTakeawayImport(pairs, schedules, existing);
    await writeFile(values.report ?? "", reportMarkdown(plan));
    const blocked = plan.filter((row) => row.action === "blocked");
    if (blocked.length) {
      throw new Error(
        `${blocked.length} blocked entries; inspect the report. Nothing written.`
      );
    }
    const inserts = plan.filter((row) => row.action === "insert");
    if (values.apply && inserts.length) {
      const records = inserts.map((row) => ({
        contributors: "[]",
        keypoints: row.notes.content,
        scheduleId: row.scheduleId,
        status: "draft",
        tldr: row.tldr.content,
      }));
      await transaction`insert into takeaways ${transaction(records, "scheduleId", "keypoints", "tldr", "contributors", "status")}`;
    }
    process.stdout.write(
      `${values.apply ? "Applied" : "Preview"}: ${inserts.length} inserts; ${plan.length - inserts.length} unchanged; ${blocked.length} blocked.\nReport: ${values.report}\n`
    );
  });
} finally {
  await sql.end();
}
