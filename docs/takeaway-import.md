# Takeaway and TL;DR import

Staff now import from the documents in the app: set both links on
Settings → Integrations, then use "Import from Docs" on Add takeaway. It shows
a preview, adds drafts and updates unpublished takeaways, skips dates without
exactly one gathering, and never touches published takeaways. Running it again
with the same documents changes nothing. Fix a mistyped date in the document
heading rather than mapping it.

The local script below is the earlier one-off and is kept for reference.

Each takeaway stores its full notes in `keypoints` and its optional summary in
`tldr`. Migration 0020 adds the nullable text column; older rows remain valid.
This branch is based on PR #67 and does not change its permissions or workflow.
Shared drafting, feedback, assignments and the final QA stage are separate work.

The source documents are:

- Notes: https://docs.google.com/document/d/1FATkCWWmfpL0sakmRK6Cxa-Nm5rKQXn6EiUAlviTRrc/edit
- TL;DR: https://docs.google.com/document/d/1kc1baKu1esvzLG6HnUW98iLsRueLQglEOcF7CuBtock/edit

Export each document as HTML. Keep the original HTML and text exports locally
under the ignored `request/takeaway-import/` directory, along with a dev-database
backup, the date mappings and reports. Do not commit the imported content.
HTML export retains paragraph, heading, emphasis and list structure; the importer
converts these to Markdown. Wording, source headings and speaker lines remain in
each imported field. Preambles are preserved in the report, outside takeaway text.
The source HTML remains the reference for original visual formatting.

The June headings in both documents say 7 June 2026, but the matching gathering
is 6 June. The August TL;DR says 2 August; the matching notes and gathering say
1 August. Supply the explicit mappings below; the importer never guesses a date:

```json
{
  "2026-06-07": "2026-06-06",
  "2026-08-02": "2026-08-01"
}
```

With `DATABASE_URL` pointing to the dev database, apply migrations normally,
back up the database, then preview:

```sh
pnpm dlx tsx scripts/import-takeaways.ts --notes request/takeaway-import/notes.html --tldr request/takeaway-import/tldr.html --corrections request/takeaway-import/date-mappings.json --report request/takeaway-import/preview.md
```

Inspect the entire report. Repeat with `--apply` and a different report filename
to import. Run preview again afterward: all 40 pairs should be `skip`.

The importer refuses every target except `localhost` or `127.0.0.1` on port 54320,
database `perkiweb_dev`. A missing or ambiguous gathering, duplicate source date,
unmatched pair, empty entry or differing existing takeaway blocks the whole
transaction. Apply locks and rechecks the relevant tables before inserting, so
concurrent runs cannot insert duplicates. It does not modify gathering metadata,
overwrite existing notes, infer authors from speaker names, publish records or
send broadcasts. All new rows are drafts without an assigned author. Staff can
review them locally; the generated report shows every notes/TL;DR pair together.

There is no production import command in this change. Review local results and
settle historical authorship and publication status before planning a live import.

## Local verification

The initial import inserted 40 drafts for the existing gatherings from 3 January
through 10 October 2026. At import, all 40 had both fields populated and no
publication metadata. A repeat preview skipped all 40 without writes. Content comparison
against the HTML exports passed for all 80 source entries, allowing whitespace
and displayed list-marker differences. Original source headings were retained.
Checksums confirmed that the previous 43 takeaways and all schedules were unchanged.
The backup and full paired review are in `request/takeaway-import/` locally.

Lint and typecheck passed. The default `pnpm check` test run hit a 10-second
PGlite migration setup timeout in the unrelated groups test. Without changing
test configuration or unrelated source, `pnpm exec vitest run --maxWorkers=2`
passed all 492 tests in 69 files, including the seven new import regressions.
The dev server remained available on port 3000. This change adds storage and an
import tool; it does not yet add a TL;DR form or change the drafting workflow.

After reviewing the local import, the user explicitly requested publishing those
40 historical records locally. A guarded transaction verified exactly 40 imported
drafts before marking them Published, with a new backup in
`request/takeaway-import/before-historical-publish.dump`. Checksums confirmed the
note text, summaries, authorship and all older records were unchanged. Publication
timestamps record the local approval; the historical publisher remains unknown.
The importer still creates drafts by default, and no live database was accessed.
