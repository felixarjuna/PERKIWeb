import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";

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
});
