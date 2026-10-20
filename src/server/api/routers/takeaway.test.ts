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

/** Content writes are admin-only. */
const signedIn = async () =>
  callerFor((await insertUser({ role: "admin" })).id);
const signedInMember = async () => callerFor((await insertUser()).id);

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

  it("rejects a takeaway for a missing schedule with NOT_FOUND", async () => {
    const api = await signedIn();

    await expect(
      api.takeaways.addTakeaway({
        contributors: [],
        keypoints: "Orphan",
        scheduleId: MISSING_ID,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await testDb.select().from(takeaways)).toEqual([]);
  });

  it("rejects moving a takeaway to a missing schedule with NOT_FOUND", async () => {
    const api = await signedIn();
    const schedule = await insertSchedule("Faith", new Date("2026-03-01"));
    await api.takeaways.addTakeaway({
      contributors: [],
      keypoints: "Notes",
      scheduleId: schedule.id,
    });
    const { id } = await onlyTakeaway();

    await expect(
      api.takeaways.updateTakeaway({
        contributors: [],
        id,
        keypoints: "Notes",
        scheduleId: MISSING_ID,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await onlyTakeaway()).scheduleId).toBe(schedule.id);
  });

  it("returns NOT_FOUND when updating or deleting a missing takeaway", async () => {
    const api = await signedIn();
    const schedule = await insertSchedule("Faith", new Date("2026-03-01"));

    await expect(
      api.takeaways.updateTakeaway({
        contributors: [],
        id: MISSING_ID,
        keypoints: "x",
        scheduleId: schedule.id,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      api.takeaways.deleteTakeaway({ id: MISSING_ID })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
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

  it("forbids members from writing takeaways", async () => {
    const admin = await signedIn();
    const schedule = await insertSchedule("Faith", new Date("2026-03-01"));
    await admin.takeaways.addTakeaway({
      contributors: [],
      keypoints: "Notes",
      scheduleId: schedule.id,
    });
    const { id } = await onlyTakeaway();
    const member = await signedInMember();
    const takeaway = {
      contributors: [],
      keypoints: "Hacked",
      scheduleId: schedule.id,
    };
    const calls = [
      member.takeaways.addTakeaway(takeaway),
      member.takeaways.updateTakeaway({ ...takeaway, id }),
      member.takeaways.deleteTakeaway({ id }),
    ];

    await Promise.all(
      calls.map((call) =>
        expect(call).rejects.toMatchObject({ code: "FORBIDDEN" })
      )
    );
    expect((await onlyTakeaway()).keypoints).toBe("Notes");
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

  describe("roles", () => {
    const sample = (scheduleId: number, keypoints = "Notes") => ({
      contributors: [],
      keypoints,
      scheduleId,
    });
    const rows = () => testDb.select().from(takeaways).orderBy(takeaways.id);

    it("lets a writer add a takeaway for any schedule and credits them", async () => {
      const writer = await insertUser({ role: "writer" });
      const schedule = await insertSchedule("Faith", new Date("2026-03-01"));

      await callerFor(writer.id).takeaways.addTakeaway(sample(schedule.id));

      expect((await onlyTakeaway()).authorId).toBe(writer.id);
    });

    it("lets a writer edit and delete only their own takeaways", async () => {
      const mine = await insertUser({ role: "writer" });
      const other = await insertUser({ role: "writer" });
      const schedule = await insertSchedule("Faith", new Date("2026-03-01"));
      await callerFor(mine.id).takeaways.addTakeaway(
        sample(schedule.id, "Mine")
      );
      await callerFor(other.id).takeaways.addTakeaway(
        sample(schedule.id, "Theirs")
      );
      const [own, foreign] = await rows();
      if (!(own && foreign)) {
        throw new Error("expected two takeaways");
      }
      const api = callerFor(mine.id);

      await expect(
        api.takeaways.updateTakeaway({
          ...sample(schedule.id, "Hacked"),
          id: foreign.id,
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        api.takeaways.deleteTakeaway({ id: foreign.id })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect((await rows()).map((row) => row.keypoints)).toEqual([
        "Mine",
        "Theirs",
      ]);

      await api.takeaways.updateTakeaway({
        ...sample(schedule.id, "Edited"),
        id: own.id,
      });
      expect((await rows()).map((row) => row.keypoints)).toEqual([
        "Edited",
        "Theirs",
      ]);
      await api.takeaways.deleteTakeaway({ id: own.id });
      expect((await rows()).map((row) => row.keypoints)).toEqual(["Theirs"]);
    });

    it("lets mita and the owner manage every takeaway, including authorless ones", async () => {
      const writer = await insertUser({ role: "writer" });
      const schedule = await insertSchedule("Faith", new Date("2026-03-01"));
      await callerFor(writer.id).takeaways.addTakeaway(sample(schedule.id));
      await testDb
        .insert(takeaways)
        .values({ ...sample(schedule.id, "Legacy"), authorId: null });

      const mita = callerFor((await insertUser({ role: "mita" })).id);
      const owner = callerFor((await insertUser({ role: "owner" })).id);
      const [first, second] = await rows();
      if (!(first && second)) {
        throw new Error("expected two takeaways");
      }

      await Promise.all([
        mita.takeaways.updateTakeaway({
          ...sample(schedule.id, "Mita"),
          id: first.id,
        }),
        owner.takeaways.updateTakeaway({
          ...sample(schedule.id, "Owner"),
          id: second.id,
        }),
      ]);
      expect((await rows()).map((row) => row.keypoints)).toEqual([
        "Mita",
        "Owner",
      ]);

      await Promise.all([
        owner.takeaways.deleteTakeaway({ id: first.id }),
        mita.takeaways.deleteTakeaway({ id: second.id }),
      ]);
      expect(await rows()).toEqual([]);
    });

    it("keeps writers from authorless takeaways", async () => {
      const writer = await insertUser({ role: "writer" });
      const schedule = await insertSchedule("Faith", new Date("2026-03-01"));
      await testDb.insert(takeaways).values(sample(schedule.id, "Legacy"));
      const { id } = await onlyTakeaway();

      await expect(
        callerFor(writer.id).takeaways.deleteTakeaway({ id })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("keeps members out of takeaway writes", async () => {
      const member = callerFor((await insertUser({ role: "member" })).id);
      const schedule = await insertSchedule("Faith", new Date("2026-03-01"));

      await expect(
        member.takeaways.addTakeaway(sample(schedule.id))
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(member.takeaways.getManageable()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(await rows()).toEqual([]);
    });

    it("never sends authorId from the public queries", async () => {
      const writer = await insertUser({ role: "writer" });
      const schedule = await insertSchedule("Faith", new Date("2026-03-01"));
      await callerFor(writer.id).takeaways.addTakeaway(sample(schedule.id));
      const { id } = await onlyTakeaway();
      const visitor = anonymousCaller();

      const list = await visitor.takeaways.getTakeaways();
      const single = await visitor.takeaways.getTakeawayById({ id });

      expect(list).toHaveLength(1);
      for (const row of [...list, single]) {
        expect(row.takeaways).not.toHaveProperty("authorId");
        expect(row.takeaways).toMatchObject({ id, keypoints: "Notes" });
        expect(row.schedules.title).toBe("Faith");
      }
    });

    it("marks canManage per viewer and never sends authorId", async () => {
      const mine = await insertUser({ role: "writer" });
      const other = await insertUser({ role: "writer" });
      const schedule = await insertSchedule("Faith", new Date("2026-03-01"));
      await callerFor(mine.id).takeaways.addTakeaway(
        sample(schedule.id, "Mine")
      );
      await callerFor(other.id).takeaways.addTakeaway(
        sample(schedule.id, "Theirs")
      );
      await testDb.insert(takeaways).values(sample(schedule.id, "Legacy"));
      const flags = (
        list: Awaited<
          ReturnType<ReturnType<typeof callerFor>["takeaways"]["getManageable"]>
        >
      ) =>
        Object.fromEntries(
          list.map((row) => [row.takeaways.keypoints, row.canManage])
        );

      const asWriter = await callerFor(mine.id).takeaways.getManageable();
      expect(flags(asWriter)).toEqual({
        Legacy: false,
        Mine: true,
        Theirs: false,
      });
      const asOwner = await callerFor(
        (await insertUser({ role: "owner" })).id
      ).takeaways.getManageable();
      expect(flags(asOwner)).toEqual({
        Legacy: true,
        Mine: true,
        Theirs: true,
      });
      for (const row of [...asWriter, ...asOwner]) {
        expect(row.takeaways).not.toHaveProperty("authorId");
        expect(row.schedules.title).toBe("Faith");
      }
    });
  });
});
