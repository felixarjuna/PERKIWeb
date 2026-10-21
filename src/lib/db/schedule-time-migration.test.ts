import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import journal from "./migrations/meta/_journal.json" with { type: "json" };

const TAG = "0015_schedule_default_time";
/** Building a database from every migration takes a few seconds under load. */
const MIGRATION_TIMEOUT = 30_000;

const sqlOf = (tag: string) =>
  readFileSync(new URL(`./migrations/${tag}.sql`, import.meta.url), "utf8");

describe(`${TAG} data fix`, () => {
  it(
    "moves schedules stored at 00:00 in Aachen to 15:30 and leaves set times",
    async () => {
      const db = new PGlite();
      const index = journal.entries.findIndex((entry) => entry.tag === TAG);
      await db.exec(
        journal.entries
          .slice(0, index)
          .map((entry) => sqlOf(entry.tag))
          .join("\n")
      );
      // Winter (UTC+1), summer (UTC+2), and one already at 18:00.
      await db.exec(`
        insert into "schedules" ("id", "bibleVerse", "cleaningGroup", "date", "description", "leader", "musician", "noteWriter", "title", "type") values
          (1, 'v', 'g', '2026-01-02T23:00:00Z', 'd', 'a', 'b', 'c', 't', 'bible_study'),
          (2, 'v', 'g', '2026-06-12T22:00:00Z', 'd', 'a', 'b', 'c', 't', 'church_service'),
          (3, 'v', 'g', '2026-06-13T16:00:00Z', 'd', 'a', 'b', 'c', 't', 'church_service');
      `);

      await db.exec(sqlOf(TAG));

      const { rows } = await db.query<{ date: Date }>(
        `select "date" from "schedules" order by "id"`
      );
      expect(rows.map((row) => row.date.toISOString())).toEqual([
        "2026-01-03T14:30:00.000Z",
        "2026-06-13T13:30:00.000Z",
        "2026-06-13T16:00:00.000Z",
      ]);
      await db.close();
    },
    MIGRATION_TIMEOUT
  );
});
