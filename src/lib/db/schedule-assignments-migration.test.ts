import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import journal from "./migrations/meta/_journal.json" with { type: "json" };

const TAG = "0011_schedule_assignments_groups";
/** Building a database from every migration takes a few seconds under load. */
const MIGRATION_TIMEOUT = 30_000;

const sqlOf = (tag: string) =>
  readFileSync(new URL(`./migrations/${tag}.sql`, import.meta.url), "utf8");

/** Runs 0011 on a database that already holds schedules, like production. */
describe(`${TAG} backfill`, () => {
  it(
    "copies filled slots and seeds the April 2026 groups",
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
      insert into "user" ("id", "name") values ('u1', 'Ana Lee'), ('u2', 'Ben'), ('u3', 'ben');
      insert into "schedules" ("id", "bibleVerse", "cleaningGroup", "date", "description", "leader", "musician", "noteWriter", "preacher", "multimedia", "title", "type")
      values
        (1, 'v', 'Group 1', now(), 'd', 'ana lee', 'Ben', ' - ', 'Pastor', '', 't', 'church_service'),
        (2, 'v', 'Group 2', now(), 'd', 'Ana Lee', 'Cleo', 'Dan', null, null, 't', 'bible_study');
    `);

      await db.exec(sqlOf(TAG));

      const { rows } = await db.query(
        `select "scheduleId", "role", "name", "userId" from "schedule_assignments" order by "scheduleId", "id"`
      );
      expect(rows).toEqual([
        { name: "Pastor", role: "preacher", scheduleId: 1, userId: null },
        { name: "ana lee", role: "liturgist", scheduleId: 1, userId: "u1" },
        { name: "Ben", role: "musician", scheduleId: 1, userId: null },
        { name: "Ana Lee", role: "leader", scheduleId: 2, userId: "u1" },
        { name: "Cleo", role: "musician", scheduleId: 2, userId: null },
        { name: "Dan", role: "note_writer", scheduleId: 2, userId: null },
      ]);
      const groups = await db.query<{ members: number; name: string }>(
        `select g."name", count(m.*)::int as "members" from "groups" g join "group_members" m on m."groupId" = g."id" group by g."name" order by g."name"`
      );
      expect(groups.rows).toEqual([
        { members: 8, name: "Group 1" },
        { members: 7, name: "Group 2" },
        { members: 7, name: "Group 3" },
        { members: 7, name: "Group 4" },
        { members: 7, name: "Group 5" },
        { members: 7, name: "Group 6" },
      ]);
      await db.close();
    },
    MIGRATION_TIMEOUT
  );
});
