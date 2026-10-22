import { readFileSync } from "node:fs";
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { schedules, takeaways } from "~/lib/db/schema/schema";
import { testDb } from "~/test/db";

/**
 * Migration 0021 publishes the historical takeaways for gatherings that
 * exist and have none yet. It already ran (on an empty database) when the
 * tests migrated, so these tests run its SQL again over seeded gatherings.
 */
const MIGRATION = new URL(
  "../lib/db/migrations/0021_historical_takeaways.sql",
  import.meta.url
);
const runMigration = async () => {
  for (const statement of readFileSync(MIGRATION, "utf8").split(
    "--> statement-breakpoint"
  )) {
    if (statement.trim()) {
      // biome-ignore lint/performance/noAwaitInLoops: statements run in order.
      await testDb.execute(sql.raw(statement));
    }
  }
};

/** A gathering at 15:30 in Aachen on `day` (summer or winter time). */
const gathering = async (
  day: string,
  type: "bible_study" | "church_service"
) => {
  const [row] = await testDb
    .insert(schedules)
    .values({
      bibleVerse: "",
      cleaningGroup: "Group 1",
      date: sql`(${day}::date + time '15:30') at time zone 'Europe/Berlin'` as never,
      description: "Seeded",
      leader: "Leader",
      musician: "Musician",
      noteWriter: "Writer",
      title: type === "bible_study" ? "Penelaahan Alkitab" : "Kebaktian",
      type,
    })
    .returning({ id: schedules.id });
  if (!row) {
    throw new Error("Failed to insert schedule");
  }
  return row.id;
};

describe("migration 0021: historical takeaways", () => {
  it("publishes notes and TL;DR for matching gatherings that have none", async () => {
    const first = await gathering("2026-01-03", "bible_study");
    const last = await gathering("2026-10-10", "church_service");

    await runMigration();

    const rows = await testDb.select().from(takeaways).orderBy(takeaways.id);
    expect(rows.map((row) => row.scheduleId).sort()).toEqual(
      [first, last].sort()
    );
    for (const row of rows) {
      expect(row).toMatchObject({
        authorId: null,
        contributors: [],
        publishedById: null,
        status: "published",
      });
      expect(row.publishedAt).toBeInstanceOf(Date);
      expect(row.keypoints.length).toBeGreaterThan(100);
      expect(row.tldr?.startsWith("### **TL;DR")).toBe(true);
    }
    const [firstNote] = await testDb
      .select()
      .from(takeaways)
      .where(eq(takeaways.scheduleId, first));
    expect(firstNote?.keypoints).toContain("03-01-2026");
  });

  it("skips gatherings that already have a takeaway, other types and reruns", async () => {
    const taken = await gathering("2026-01-03", "bible_study");
    // Same day, other type: not a match.
    await gathering("2026-01-10", "bible_study");
    await testDb.insert(takeaways).values({
      contributors: ["Writer"],
      keypoints: "Written on the site",
      scheduleId: taken,
      status: "draft",
    });

    await runMigration();
    await runMigration();

    const rows = await testDb.select().from(takeaways);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      keypoints: "Written on the site",
      status: "draft",
    });
  });

  it("does nothing on a database without these gatherings", async () => {
    await runMigration();
    expect(await testDb.select().from(takeaways)).toEqual([]);
  });
});
