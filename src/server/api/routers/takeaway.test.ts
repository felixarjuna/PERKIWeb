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
const staff = async () => callerFor((await insertUser({ role: "mita" })).id);

/** Publishes the takeaway as a staff member, so the public can read it. */
const publish = async (id: number) => {
  await (await staff()).takeaways.setStatus({ id, status: "published" });
};

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
    await publish(id);

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
    for (const row of await testDb.select().from(takeaways)) {
      // biome-ignore lint/performance/noAwaitInLoops: fixtures, one at a time.
      await publish(row.id);
    }

    const list = (await anonymousCaller().takeaways.getTakeaways({})).items;

    expect(list.map((row) => row.schedules.title)).toEqual([
      "Newest",
      "Middle",
      "Older",
    ]);
    for (const row of list) {
      expect(row.takeaways.scheduleId).toBe(row.schedules.id);
      expect(row.takeaways.preview).toBe(`Notes for ${row.schedules.title}`);
    }
  });

  it("lists a plain-text preview instead of the Markdown", async () => {
    const api = await signedIn();
    const schedule = await insertSchedule("Nuh", new Date("2026-03-01"));
    await api.takeaways.addTakeaway({
      contributors: [],
      keypoints: "## Integritas Nuh\n\nNuh **taat**.\n\n- Mezbah",
      scheduleId: schedule.id,
    });

    const [listed] = (await anonymousCaller().takeaways.getTakeaways({})).items;
    const [managed] = (await api.takeaways.getManageable({})).items;

    for (const row of [listed, managed]) {
      expect(row?.takeaways.preview).toBe("Integritas Nuh\nNuh taat.\nMezbah");
      expect(row?.takeaways).not.toHaveProperty("keypoints");
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
      await expect(member.takeaways.getManageable({})).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(await rows()).toEqual([]);
    });

    it("never sends authorId from the public queries", async () => {
      const writer = await insertUser({ role: "writer" });
      const schedule = await insertSchedule("Faith", new Date("2026-03-01"));
      await callerFor(writer.id).takeaways.addTakeaway(sample(schedule.id));
      const { id } = await onlyTakeaway();
      await publish(id);
      const visitor = anonymousCaller();

      const list = (await visitor.takeaways.getTakeaways({})).items;
      const single = await visitor.takeaways.getTakeawayById({ id });

      expect(list).toHaveLength(1);
      for (const row of [...list, single]) {
        expect(row.takeaways).not.toHaveProperty("authorId");
        expect(row.takeaways).toMatchObject({ id });
        expect(row.schedules.title).toBe("Faith");
      }
      expect(list[0]?.takeaways.preview).toBe("Notes");
      expect(single.takeaways.keypoints).toBe("Notes");
    });

    it("marks canManage per viewer and never sends authorId", async () => {
      const mine = await insertUser({ role: "writer" });
      const other = await insertUser({ role: "writer" });
      const schedule = await insertSchedule("Faith", new Date("2026-03-01"));
      await callerFor(mine.id).takeaways.addTakeaway(
        sample(schedule.id, "Mine")
      );
      // Another writer's takeaway is only listed once it is in review.
      await callerFor(other.id).takeaways.addTakeaway({
        ...sample(schedule.id, "Theirs"),
        status: "in_review",
      });
      await testDb.insert(takeaways).values(sample(schedule.id, "Legacy"));
      const flags = (
        list: Awaited<
          ReturnType<ReturnType<typeof callerFor>["takeaways"]["getManageable"]>
        >["items"]
      ) =>
        Object.fromEntries(
          list.map((row) => [row.takeaways.preview, row.canManage])
        );

      const asWriter = (await callerFor(mine.id).takeaways.getManageable({}))
        .items;
      expect(flags(asWriter)).toEqual({
        Legacy: false,
        Mine: true,
        Theirs: false,
      });
      const asOwner = (
        await callerFor(
          (
            await insertUser({ role: "owner" })
          ).id
        ).takeaways.getManageable({})
      ).items;
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

  describe("status", () => {
    const sample = (scheduleId: number, keypoints = "Notes") => ({
      contributors: [],
      keypoints,
      scheduleId,
    });
    const rows = () => testDb.select().from(takeaways).orderBy(takeaways.id);
    /** A writer, their takeaway (as `status`) and the schedule it belongs to. */
    const draftBy = async (
      role: "writer" | "mita" = "writer",
      status: "draft" | "in_review" = "draft"
    ) => {
      const author = await insertUser({ role });
      const schedule = await insertSchedule("Faith", new Date("2026-03-01"));
      await callerFor(author.id).takeaways.addTakeaway({
        ...sample(schedule.id),
        status,
      });
      const { id } = await onlyTakeaway();
      return { author, id, schedule };
    };
    const statusOf = async (id: number) =>
      (await rows()).find((row) => row.id === id)?.status;

    it("starts a new takeaway as a draft that only its author and staff can read", async () => {
      const { author, id, schedule } = await draftBy();
      const visitor = anonymousCaller();
      const member = await signedInMember();
      const otherWriter = callerFor((await insertUser({ role: "writer" })).id);

      expect(await statusOf(id)).toBe("draft");
      expect((await visitor.takeaways.getTakeaways({})).items).toEqual([]);
      expect(await visitor.takeaways.months()).toEqual([]);
      for (const api of [visitor, member, otherWriter]) {
        // biome-ignore lint/performance/noAwaitInLoops: assertions in order.
        await expect(
          api.takeaways.getTakeawayById({ id })
        ).rejects.toMatchObject({ code: "NOT_FOUND" });
      }
      const gathering = await visitor.schedules.getGathering({
        id: schedule.id,
      });
      expect(gathering.takeawayIds).toEqual([]);
      expect((await otherWriter.takeaways.getManageable({})).items).toEqual([]);

      const mine = await callerFor(author.id).takeaways.getTakeawayById({ id });
      expect(mine.takeaways).toMatchObject({ id, status: "draft" });
      const staffView = await (await staff()).takeaways.getTakeawayById({ id });
      expect(staffView.takeaways.status).toBe("draft");
      const manageable = (
        await callerFor(author.id).takeaways.getManageable({})
      ).items;
      expect(manageable.map((row) => row.takeaways.status)).toEqual(["draft"]);
    });

    it("lets a writer send their own draft to review and withdraw it, not publish it", async () => {
      const { author, id } = await draftBy();
      const api = callerFor(author.id);

      await api.takeaways.setStatus({ id, status: "in_review" });
      expect(await statusOf(id)).toBe("in_review");
      await expect(
        api.takeaways.setStatus({ id, status: "published" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(await statusOf(id)).toBe("in_review");
      await api.takeaways.setStatus({ id, status: "draft" });
      expect(await statusOf(id)).toBe("draft");
    });

    it("can be created straight into review, never straight to published", async () => {
      const { id } = await draftBy("writer", "in_review");
      expect(await statusOf(id)).toBe("in_review");

      const writer = callerFor((await insertUser({ role: "writer" })).id);
      const schedule = await insertSchedule("Hope", new Date("2026-04-01"));
      await expect(
        writer.takeaways.addTakeaway({
          ...sample(schedule.id),
          status: "published",
        } as never)
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("shows a takeaway in review to other writers, read-only", async () => {
      const { id } = await draftBy("writer", "in_review");
      const other = callerFor((await insertUser({ role: "writer" })).id);

      const single = await other.takeaways.getTakeawayById({ id });
      expect(single.takeaways.status).toBe("in_review");
      const list = (await other.takeaways.getManageable({})).items;
      expect(list.map((row) => row.takeaways.status)).toEqual(["in_review"]);
      expect(list[0]).toMatchObject({ canManage: false, canPublish: false });
      await expect(
        other.takeaways.setStatus({ id, status: "draft" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        other.takeaways.updateTakeaway({ ...sample(1, "Hacked"), id })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      // Members still can't see it.
      await expect(
        (await signedInMember()).takeaways.getTakeawayById({ id })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(
        (await anonymousCaller().takeaways.getTakeaways({})).items
      ).toEqual([]);
    });

    it("lets staff publish, which records who and when, and send back, which clears it", async () => {
      const { id, schedule } = await draftBy("writer", "in_review");
      const mita = await insertUser({ role: "mita" });
      const before = Date.now();

      await callerFor(mita.id).takeaways.setStatus({ id, status: "published" });

      const [published] = await rows();
      expect(published).toMatchObject({
        publishedById: mita.id,
        status: "published",
      });
      expect(published?.publishedAt?.getTime()).toBeGreaterThanOrEqual(before);
      const visitor = anonymousCaller();
      const list = (await visitor.takeaways.getTakeaways({})).items;
      expect(list.map((row) => row.takeaways.id)).toEqual([id]);
      expect(list[0]?.takeaways).not.toHaveProperty("publishedById");
      expect(await visitor.takeaways.months()).toEqual(["2026-03"]);
      expect(
        (await visitor.schedules.getGathering({ id: schedule.id })).takeawayIds
      ).toEqual([id]);

      await callerFor(mita.id).takeaways.setStatus({ id, status: "draft" });

      const [sentBack] = await rows();
      expect(sentBack).toMatchObject({
        publishedAt: null,
        publishedById: null,
        status: "draft",
      });
      expect((await visitor.takeaways.getTakeaways({})).items).toEqual([]);
    });

    it("keeps a writer from editing or deleting their own published takeaway", async () => {
      const { author, id, schedule } = await draftBy();
      await publish(id);
      const api = callerFor(author.id);

      await expect(
        api.takeaways.updateTakeaway({ ...sample(schedule.id, "Later"), id })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(api.takeaways.deleteTakeaway({ id })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(
        api.takeaways.setStatus({ id, status: "draft" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      const [row] = (await api.takeaways.getManageable({})).items;
      expect(row).toMatchObject({ canManage: false, canPublish: false });

      // Staff still can.
      await (await staff()).takeaways.updateTakeaway({
        ...sample(schedule.id, "Later"),
        id,
      });
      expect((await onlyTakeaway()).keypoints).toBe("Later");
    });

    it("filters the manageable list by status and returns NOT_FOUND for a missing takeaway", async () => {
      const { author, schedule } = await draftBy();
      const api = callerFor(author.id);
      await api.takeaways.addTakeaway({
        ...sample(schedule.id, "Review me"),
        status: "in_review",
      });

      const drafts = (await api.takeaways.getManageable({ status: "draft" }))
        .items;
      expect(drafts.map((row) => row.takeaways.keypoints)).toEqual(["Notes"]);
      const inReview = (
        await api.takeaways.getManageable({ status: "in_review" })
      ).items;
      expect(inReview.map((row) => row.takeaways.keypoints)).toEqual([
        "Review me",
      ]);
      expect((await api.takeaways.getManageable({})).items).toHaveLength(2);
      await expect(
        api.takeaways.setStatus({ id: MISSING_ID, status: "in_review" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
