import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { schedules as schedulesTable } from "~/lib/db/schema/schema";
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

const signedIn = async () => callerFor((await insertUser()).id);

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
    const user = await insertUser();
    const api = callerFor(user.id);
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
