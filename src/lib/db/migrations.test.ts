import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import journal from "./migrations/meta/_journal.json" with { type: "json" };

const migrationsDir = new URL("./migrations/", import.meta.url);

/**
 * drizzle's migrator only applies migrations whose journal timestamp (`when`)
 * is newer than the last one recorded in the database. A migration generated
 * on a branch before another branch's migration was merged would be skipped
 * forever in production, so timestamps must strictly increase with `idx`.
 */
describe("migration journal", () => {
  it("numbers migrations consecutively from 0", () => {
    expect(journal.entries.map((entry) => entry.idx)).toEqual(
      journal.entries.map((_, index) => index)
    );
  });

  it("has strictly increasing timestamps; regenerate a migration that is older than its predecessor", () => {
    for (const [index, entry] of journal.entries.entries()) {
      const previous = journal.entries[index - 1];
      if (previous) {
        expect(
          entry.when,
          `${entry.tag} must be newer than ${previous.tag}`
        ).toBeGreaterThan(previous.when);
      }
    }
  });

  it("has a SQL file for every entry", () => {
    for (const entry of journal.entries) {
      expect(
        existsSync(new URL(`${entry.tag}.sql`, migrationsDir)),
        `${entry.tag}.sql`
      ).toBe(true);
    }
  });
});
