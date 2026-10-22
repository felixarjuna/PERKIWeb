/**
 * Read-only: lists the takeaways that read differently now that the takeaway
 * page renders Markdown (#35), and why, and any the editor would change when
 * it is opened and saved untouched (Markdown → Tiptap → Markdown).
 *
 *   pnpm takeaways:markdown-check
 *
 * It reads `DATABASE_URL` and never writes: the connection only allows
 * read-only transactions. Open `/takeaway/<id>` to see each one.
 */

import { config } from "dotenv";
import postgres from "postgres";
import { markdownChanges } from "../src/lib/legacy-takeaways";
import { editorRoundTrip, rendersTheSame } from "../src/lib/takeaway-editor";

config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

console.log(`Database host: ${new URL(databaseUrl).host} (read-only)`);

const sql = postgres(databaseUrl, {
  connection: { default_transaction_read_only: true },
  max: 1,
});

try {
  const rows = await sql<
    { id: number; keypoints: string; title: string; date: Date }[]
  >`
    select t.id, t.keypoints, s.title, s.date
    from takeaways t join schedules s on s.id = t."scheduleId"
    order by s.date, t.id
  `;
  const changed = rows
    .map((row) => ({
      ...row,
      changes: [
        ...markdownChanges(row.keypoints),
        ...(rendersTheSame(row.keypoints, editorRoundTrip(row.keypoints))
          ? []
          : ["EDITOR CHANGES IT"]),
      ],
    }))
    .filter((row) => row.changes.length > 0);

  for (const row of changed) {
    const day = row.date.toISOString().slice(0, 10);
    console.log(`#${row.id}  ${day}  ${row.title}`);
    console.log(`    ${row.changes.join(", ")}`);
  }
  console.log(
    `\n${changed.length} of ${rows.length} takeaways read differently as Markdown.`
  );
} finally {
  await sql.end();
}
