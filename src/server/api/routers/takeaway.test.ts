import { describe, expect, it } from "vitest";
import { schedules, takeaways } from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const MISSING_ID = 404;

const insertSchedule = async (title: string, date: Date) => {
  const [row] = await testDb
    .insert(schedules)
    .values({
      bibleVerse: "Roma 4:1-12",
      cleaningGroup: "Group 4",
      date,
      description: "Weekly bible study",
      leader: "Leader",
      musician: "Musician",
      noteWriter: "Writer",
      title,
      type: "bible_study",
    })
    .returning();
  if (!row) {
    throw new Error("Failed to insert schedule");
  }
  return row;
};

const signedIn = async () => callerFor((await insertUser()).id);

const onlyTakeaway = async () => {
  const rows = await testDb.select().from(takeaways);
  expect(rows).toHaveLength(1);
  const [row] = rows;
  if (!row) {
    throw new Error("expected exactly one takeaway");
  }
  return row;
};

describe("takeaways router", () => {
  it("adds a takeaway and reads it back joined with its schedule", async () => {
    const api = await signedIn();
    const schedule = await insertSchedule("Faith", new Date("2026-03-01"));

    await api.takeaways.addTakeaway({
      contributors: ["Alice", "Bob"],
      keypoints: "Abraham believed God",
      scheduleId: schedule.id,
    });
    const { id } = await onlyTakeaway();

    const result = await anonymousCaller().takeaways.getTakeawayById({ id });
    expect(result.takeaways).toMatchObject({
      contributors: ["Alice", "Bob"],
      keypoints: "Abraham believed God",
      scheduleId: schedule.id,
    });
    expect(result.schedules).toMatchObject({ id: schedule.id, title: "Faith" });
  });

  it("lists takeaways joined with schedules, newest schedule date first", async () => {
    const api = await signedIn();
    const older = await insertSchedule("Older", new Date("2026-01-01"));
    const newest = await insertSchedule("Newest", new Date("2026-09-01"));
    const middle = await insertSchedule("Middle", new Date("2026-05-01"));
    // Insert in an order unrelated to the schedule dates.
    await Promise.all(
      [middle, older, newest].map((schedule) =>
        api.takeaways.addTakeaway({
          contributors: [],
          keypoints: `Notes for ${schedule.title}`,
          scheduleId: schedule.id,
        })
      )
    );

    const list = await anonymousCaller().takeaways.getTakeaways();

    expect(list.map((row) => row.schedules.title)).toEqual([
      "Newest",
      "Middle",
      "Older",
    ]);
    for (const row of list) {
      expect(row.takeaways.scheduleId).toBe(row.schedules.id);
      expect(row.takeaways.keypoints).toBe(`Notes for ${row.schedules.title}`);
    }
  });

  it("omits takeaways whose schedule does not exist", async () => {
    const api = await signedIn();

    await api.takeaways.addTakeaway({
      contributors: [],
      keypoints: "Orphan",
      scheduleId: MISSING_ID,
    });

    expect(await anonymousCaller().takeaways.getTakeaways()).toEqual([]);
  });

  it("returns NOT_FOUND for a missing takeaway", async () => {
    await expect(
      anonymousCaller().takeaways.getTakeawayById({ id: MISSING_ID })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("updates a takeaway", async () => {
    const api = await signedIn();
    const schedule = await insertSchedule("Faith", new Date("2026-03-01"));
    await api.takeaways.addTakeaway({
      contributors: ["Alice"],
      keypoints: "Draft",
      scheduleId: schedule.id,
    });
    const { id } = await onlyTakeaway();

    await api.takeaways.updateTakeaway({
      contributors: ["Alice", "Carol"],
      id,
      keypoints: "Final",
      scheduleId: schedule.id,
    });

    expect(await onlyTakeaway()).toMatchObject({
      contributors: ["Alice", "Carol"],
      keypoints: "Final",
    });
  });

  it("deletes a takeaway", async () => {
    const api = await signedIn();
    const schedule = await insertSchedule("Faith", new Date("2026-03-01"));
    await api.takeaways.addTakeaway({
      contributors: [],
      keypoints: "Bye",
      scheduleId: schedule.id,
    });
    const { id } = await onlyTakeaway();

    await api.takeaways.deleteTakeaway({ id });

    expect(await testDb.select().from(takeaways)).toEqual([]);
  });

  it("rejects malformed input with BAD_REQUEST", async () => {
    const api = await signedIn();

    await expect(
      api.takeaways.addTakeaway({
        contributors: "Alice",
        keypoints: "x",
        scheduleId: 1,
      } as never)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      api.takeaways.getTakeawayById({ id: "1" } as never)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects writes from signed-out visitors", async () => {
    const api = anonymousCaller();
    const takeaway = { contributors: [], keypoints: "x", scheduleId: 1 };
    const calls = [
      api.takeaways.addTakeaway(takeaway),
      api.takeaways.updateTakeaway({ ...takeaway, id: 1 }),
      api.takeaways.deleteTakeaway({ id: 1 }),
    ];

    await Promise.all(
      calls.map((call) =>
        expect(call).rejects.toMatchObject({ code: "UNAUTHORIZED" })
      )
    );
  });
});
