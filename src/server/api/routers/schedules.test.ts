import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import {
  groupMembers,
  groups,
  groupTerms,
  scheduleAssignments,
  schedules as schedulesTable,
  takeaways,
} from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const validSchedule = {
  bibleVerse: "Roma 4:1-12",
  cleaningGroup: "Group 4",
  date: new Date("2026-10-10T18:00:00.000Z"),
  description: "Weekly bible study",
  leader: "Leader",
  musician: "Musician",
  noteWriter: "Writer",
  title: "Heroes of Faith",
  type: "bible_study" as const,
};

/** Content writes are admin-only. */
const signedIn = async () =>
  callerFor((await insertUser({ role: "admin" })).id);
const signedInMember = async () => callerFor((await insertUser()).id);

const onlySchedule = async () => {
  const rows = await testDb.select().from(schedulesTable);
  expect(rows).toHaveLength(1);
  const [row] = rows;
  if (!row) {
    throw new Error("expected exactly one schedule");
  }
  return row;
};

describe("schedules router", () => {
  it("lets anyone read schedules, newest first", async () => {
    const api = await signedIn();
    await api.schedules.addScheduleBatch([
      { ...validSchedule, date: new Date("2026-01-01"), title: "Older" },
      { ...validSchedule, date: new Date("2026-06-01"), title: "Newer" },
    ]);

    const schedules = await anonymousCaller().schedules.getSchedules();

    expect(schedules.map((s) => s.title)).toEqual(["Newer", "Older"]);
  });

  it("rejects writes from signed-out visitors", async () => {
    await expect(
      anonymousCaller().schedules.addSchedule(validSchedule)
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns NOT_FOUND for a missing schedule", async () => {
    const error = await anonymousCaller()
      .schedules.getScheduleById({ id: 404 })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error).toMatchObject({ code: "NOT_FOUND" });
  });

  it("adds a schedule and reads it back by id", async () => {
    const api = await signedIn();

    await api.schedules.addSchedule({
      ...validSchedule,
      preacher: "Pastor",
    });
    const { id } = await onlySchedule();

    const schedule = await anonymousCaller().schedules.getScheduleById({ id });
    expect(schedule).toMatchObject({
      ...validSchedule,
      accommodation: null,
      cookingGroup: null,
      id,
      multimedia: null,
      preacher: "Pastor",
    });
    expect(typeof schedule.id).toBe("number");
  });

  it("adds a batch of schedules in one call", async () => {
    const api = await signedIn();

    await api.schedules.addScheduleBatch([
      { ...validSchedule, title: "First" },
      { ...validSchedule, title: "Second", type: "church_service" },
      { ...validSchedule, title: "Third" },
    ]);

    const rows = await testDb.select().from(schedulesTable);
    expect(rows.map((row) => row.title).sort()).toEqual([
      "First",
      "Second",
      "Third",
    ]);
    expect(rows.find((row) => row.title === "Second")?.type).toBe(
      "church_service"
    );
  });

  it("rejects the whole batch if one schedule is invalid", async () => {
    const api = await signedIn();

    await expect(
      api.schedules.addScheduleBatch([
        { ...validSchedule, title: "Valid" },
        { ...validSchedule, title: "x" },
      ])
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await testDb.select().from(schedulesTable)).toEqual([]);
  });

  it("rejects a title shorter than 2 characters with BAD_REQUEST", async () => {
    const api = await signedIn();

    await expect(
      api.schedules.addSchedule({ ...validSchedule, title: "x" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await testDb.select().from(schedulesTable)).toEqual([]);
  });

  it("rejects an unknown event type with BAD_REQUEST", async () => {
    const api = await signedIn();

    await expect(
      api.schedules.addSchedule({ ...validSchedule, type: "party" } as never)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("updates a schedule", async () => {
    const api = await signedIn();
    await api.schedules.addSchedule(validSchedule);
    const { id } = await onlySchedule();

    await api.schedules.updateSchedule({
      ...validSchedule,
      id,
      leader: "New Leader",
      title: "Renamed",
    });

    expect(await onlySchedule()).toMatchObject({
      leader: "New Leader",
      title: "Renamed",
    });
  });

  it("validates updates like inserts", async () => {
    const api = await signedIn();
    await api.schedules.addSchedule(validSchedule);
    const { id } = await onlySchedule();

    await expect(
      api.schedules.updateSchedule({ ...validSchedule, id, title: "x" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await onlySchedule()).title).toBe(validSchedule.title);
  });

  it("deletes a schedule", async () => {
    const api = await signedIn();
    await api.schedules.addSchedule(validSchedule);
    const { id } = await onlySchedule();

    await api.schedules.deleteSchedule({ id });

    expect(await anonymousCaller().schedules.getSchedules()).toEqual([]);
  });

  it("deletes a schedule's takeaways along with it", async () => {
    const api = await signedIn();
    await api.schedules.addSchedule(validSchedule);
    const { id } = await onlySchedule();
    await api.takeaways.addTakeaway({
      contributors: [],
      keypoints: "Notes",
      scheduleId: id,
    });

    await api.schedules.deleteSchedule({ id });

    expect(await testDb.select().from(takeaways)).toEqual([]);
  });

  it("returns NOT_FOUND when updating or deleting a missing schedule", async () => {
    const api = await signedIn();

    await expect(
      api.schedules.updateSchedule({ ...validSchedule, id: 404 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      api.schedules.deleteSchedule({ id: 404 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("forbids members from writing schedules", async () => {
    const admin = await signedIn();
    await admin.schedules.addSchedule(validSchedule);
    const { id } = await onlySchedule();
    const member = await signedInMember();
    const calls = [
      member.schedules.addSchedule(validSchedule),
      member.schedules.addScheduleBatch([validSchedule]),
      member.schedules.updateSchedule({
        ...validSchedule,
        id,
        title: "Hacked",
      }),
      member.schedules.deleteSchedule({ id }),
    ];

    await Promise.all(
      calls.map((call) =>
        expect(call).rejects.toMatchObject({ code: "FORBIDDEN" })
      )
    );
    expect((await onlySchedule()).title).toBe(validSchedule.title);
  });

  it("records the team as assignments, linking a name only to a unique account", async () => {
    const api = await signedIn();
    const leader = await insertUser({ name: "Leader" });
    await insertUser({ name: "Musician" });
    await insertUser({ name: "Musician" });

    await api.schedules.addSchedule({ ...validSchedule, preacher: "-" });

    const rows = await testDb
      .select({
        name: scheduleAssignments.name,
        role: scheduleAssignments.role,
        userId: scheduleAssignments.userId,
      })
      .from(scheduleAssignments);
    expect(rows).toEqual([
      { name: "Leader", role: "leader", userId: leader.id },
      { name: "Musician", role: "musician", userId: null },
      { name: "Writer", role: "note_writer", userId: null },
    ]);
  });

  it("replaces the assignments when a schedule is updated", async () => {
    const api = await signedIn();
    await api.schedules.addSchedule(validSchedule);
    const { id } = await onlySchedule();

    await api.schedules.updateSchedule({
      ...validSchedule,
      id,
      leader: "Liturgist",
      multimedia: "Tech",
      type: "church_service",
    });

    const [schedule] = await anonymousCaller().schedules.getSchedules();
    expect(schedule?.team).toEqual([
      { image: null, name: "Liturgist", role: "liturgist" },
      { image: null, name: "Musician", role: "musician" },
      { image: null, name: "Tech", role: "multimedia" },
      { image: null, name: "Writer", role: "note_writer" },
    ]);
  });

  it("falls back to the name columns for schedules without assignments", async () => {
    await testDb.insert(schedulesTable).values(validSchedule);

    const [schedule] = await anonymousCaller().schedules.getSchedules();

    expect(schedule?.team.map((slot) => slot.role)).toEqual([
      "leader",
      "musician",
      "note_writer",
    ]);
  });

  it("never sends account ids with the team", async () => {
    const api = await signedIn();
    await insertUser({ name: "Leader" });
    await api.schedules.addSchedule(validSchedule);

    const [schedule] = await anonymousCaller().schedules.getSchedules();

    expect(JSON.stringify(schedule?.team)).not.toContain("userId");
  });

  it("lists the members of the groups in force on the schedule's date", async () => {
    const insertTerm = async (startsOn: string, members: string[]) => {
      const [term] = await testDb
        .insert(groupTerms)
        .values({ startsOn })
        .returning();
      const [group] = await testDb
        .insert(groups)
        .values({ name: "Group 4", termId: term?.id ?? 0 })
        .returning();
      await testDb.insert(groupMembers).values(
        members.map((name, position) => ({
          groupId: group?.id ?? 0,
          name,
          position,
        }))
      );
    };
    await insertTerm("2026-04-01", ["Ana", "Ben"]);
    await insertTerm("2026-10-01", ["Cleo"]);
    const api = await signedIn();
    await api.schedules.addScheduleBatch([
      { ...validSchedule, date: new Date("2026-03-28T18:00:00Z") },
      { ...validSchedule, date: new Date("2026-09-26T18:00:00Z") },
      { ...validSchedule, cookingGroup: "Group 9" },
    ]);

    const schedules = await anonymousCaller().schedules.getSchedules();

    expect(schedules.map((s) => s.groupMembers)).toEqual([
      { cleaning: [{ image: null, name: "Cleo" }], cooking: null },
      {
        cleaning: [
          { image: null, name: "Ana" },
          { image: null, name: "Ben" },
        ],
        cooking: null,
      },
      { cleaning: null, cooking: null },
    ]);
  });

  it("rejects every write from signed-out visitors", async () => {
    const api = anonymousCaller();
    const calls = [
      api.schedules.addScheduleBatch([validSchedule]),
      api.schedules.updateSchedule({ ...validSchedule, id: 1 }),
      api.schedules.deleteSchedule({ id: 1 }),
    ];

    await Promise.all(
      calls.map((call) =>
        expect(call).rejects.toMatchObject({ code: "UNAUTHORIZED" })
      )
    );
  });
});
