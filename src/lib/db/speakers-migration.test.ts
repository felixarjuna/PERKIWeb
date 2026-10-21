import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import journal from "./migrations/meta/_journal.json" with { type: "json" };

const TAG = "0013_speakers";
/** Building a database from every migration takes a few seconds under load. */
const MIGRATION_TIMEOUT = 30_000;

const sqlOf = (tag: string) =>
  readFileSync(new URL(`./migrations/${tag}.sql`, import.meta.url), "utf8");

/** Runs 0013 on a database whose schedules already name their preachers. */
describe(`${TAG} backfill`, () => {
  it(
    "seeds the pastors and links preacher slots by name or other spelling",
    async () => {
      const db = new PGlite();
      const index = journal.entries.findIndex((entry) => entry.tag === TAG);
      await db.exec(
        journal.entries
          .slice(0, index)
          .map((entry) => sqlOf(entry.tag))
          .join("\n")
      );
      await db.exec(`
        insert into "schedules" ("id", "bibleVerse", "cleaningGroup", "date", "description", "leader", "musician", "noteWriter", "title", "type")
        values (1, 'v', 'Group 1', now(), 'd', 'Ana', 'Ben', 'Cleo', 't', 'church_service');
        insert into "schedule_assignments" ("scheduleId", "role", "name", "position") values
          (1, 'preacher', 'Pdt. John  Kusuma', 0),
          (1, 'liturgist', 'Pdt. John Kusuma', 0),
          (1, 'musician', 'Ev. Riggrubben', 0),
          (1, 'note_writer', 'Cleo', 0);
        insert into "schedules" ("id", "bibleVerse", "cleaningGroup", "date", "description", "leader", "musician", "noteWriter", "title", "type")
        values (2, 'v', 'Group 1', now(), 'd', 'Ana', 'Ben', 'Cleo', 't', 'church_service');
        insert into "schedule_assignments" ("scheduleId", "role", "name", "position") values
          (2, 'preacher', 'Ev. Riggrubben', 0),
          (2, 'note_writer', 'Steffen Tjandra', 0);
      `);

      await db.exec(sqlOf(TAG));

      const speakers = await db.query<{ name: string; photoUrl: string }>(
        `select "name", "photoUrl" from "speakers" order by "id"`
      );
      expect(speakers.rows).toEqual([
        { name: "Pdt. John Kusuma", photoUrl: "/images/john.jpg" },
        { name: "Pdt. Titus Christanto", photoUrl: "/images/titus.png" },
        { name: "Ev. Riggruben", photoUrl: "/images/riggrubben.jpg" },
      ]);
      const slots = await db.query<{
        name: string;
        role: string;
        speaker: string | null;
      }>(
        `select a."role", a."name", s."name" as "speaker"
         from "schedule_assignments" a left join "speakers" s on s."id" = a."speakerId"
         order by a."id"`
      );
      // Only preacher slots point at speakers.
      expect(slots.rows.map((row) => row.speaker)).toEqual([
        "Pdt. John Kusuma",
        null,
        null,
        null,
        "Ev. Riggruben",
        null,
      ]);
      await db.close();
    },
    MIGRATION_TIMEOUT
  );
});
