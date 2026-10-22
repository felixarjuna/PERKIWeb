import { afterEach, describe, expect, it, vi } from "vitest";
import {
  scheduleAssignments,
  schedules,
  takeaways,
} from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const gathering = async (userId: string | null) => {
  const [row] = await testDb
    .insert(schedules)
    .values({
      bibleVerse: "Romans 4",
      cleaningGroup: "Group 1",
      date: new Date("2026-03-28T14:30:00Z"),
      description: "Weekly gathering",
      leader: "Leader",
      musician: "Musician",
      noteWriter: "Writer",
      title: "Faith",
      type: "bible_study",
    })
    .returning();
  if (!row) {
    throw new Error("Missing schedule");
  }
  await testDb.insert(scheduleAssignments).values({
    name: "Writer",
    role: "note_writer",
    scheduleId: row.id,
    userId,
  });
  return row;
};

describe("writer assignments", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks a draft overdue only after the end of the due day and omits future reminders", async () => {
    const writer = await insertUser({ role: "writer" });
    await gathering(writer.id);
    const api = callerFor(writer.id);
    const clock = vi
      .spyOn(Date, "now")
      .mockReturnValue(new Date("2026-03-27T12:00:00Z").getTime());
    expect((await api.writerAssignments.mine()).reminderCount).toBe(0);
    clock.mockReturnValue(new Date("2026-04-03T21:59:59.999Z").getTime());
    expect((await api.writerAssignments.mine()).items[0]?.overdue).toBe(false);
    clock.mockReturnValue(new Date("2026-04-03T22:00:00Z").getTime());
    expect((await api.writerAssignments.mine()).items[0]?.overdue).toBe(true);
  });

  it("treats a published takeaway as completed even when someone else wrote it", async () => {
    const writer = await insertUser({ role: "writer" });
    const schedule = await gathering(writer.id);
    await testDb.insert(takeaways).values({
      contributors: [],
      keypoints: "Historical published note",
      scheduleId: schedule.id,
      status: "published",
    });
    const result = await callerFor(writer.id).writerAssignments.mine();
    expect(result.items).toMatchObject([
      { overdue: false, status: "published" },
    ]);
    expect(result.reminderCount).toBe(0);
  });
  it("shows only linked personal assignments, then replaces not started with the author's draft", async () => {
    const writer = await insertUser({ role: "writer" });
    const other = await insertUser({ role: "writer" });
    const schedule = await gathering(writer.id);
    await gathering(other.id);
    await gathering(null);
    const api = callerFor(writer.id);
    const initial = await api.writerAssignments.mine();
    expect(initial.items).toHaveLength(1);
    expect(initial.items[0]).toMatchObject({
      dueAt: new Date("2026-04-03T21:59:59.999Z"),
      overdue: true,
      scheduleId: schedule.id,
      status: "not_started",
    });
    expect(initial.reminderCount).toBe(1);
    const draft = await api.takeaways.addTakeaway({
      contributors: ["Writer"],
      keypoints: "Trust in God",
      scheduleId: schedule.id,
      status: "draft",
    });
    expect((await api.writerAssignments.mine()).items).toMatchObject([
      { status: "draft", takeawayId: draft.id },
    ]);
    await api.takeaways.setStatus({ id: draft.id, status: "in_review" });
    expect((await api.writerAssignments.mine()).reminderCount).toBe(0);
  });

  it("includes personal unassigned drafts and does not expose another writer's draft", async () => {
    const writer = await insertUser({ role: "writer" });
    const other = await insertUser({ role: "writer" });
    const schedule = await gathering(writer.id);
    const unassigned = await gathering(other.id);
    await callerFor(other.id).takeaways.addTakeaway({
      contributors: [],
      keypoints: "Private",
      scheduleId: schedule.id,
      status: "draft",
    });
    const own = await callerFor(writer.id).takeaways.addTakeaway({
      contributors: [],
      keypoints: "Own draft",
      scheduleId: unassigned.id,
      status: "draft",
    });
    const { items } = await callerFor(writer.id).writerAssignments.mine();
    expect(items).toHaveLength(2);
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scheduleId: schedule.id,
          status: "not_started",
          takeawayId: null,
        }),
        expect.objectContaining({ status: "draft", takeawayId: own.id }),
      ])
    );
  });

  it("lets staff see unlinked assignments and change the deadline, without granting writers staff access", async () => {
    await gathering(null);
    const staff = callerFor((await insertUser({ role: "mita" })).id);
    expect((await staff.writerAssignments.all()).items).toMatchObject([
      { linked: false, writerName: "Writer" },
    ]);
    expect(await staff.settings.takeawayDeadline()).toBe(5);
    await staff.settings.setTakeawayDeadline({ weekday: 1 });
    expect((await staff.writerAssignments.all()).items[0]?.dueAt).toEqual(
      new Date("2026-03-30T21:59:59.999Z")
    );
    await expect(
      staff.settings.setTakeawayDeadline({ weekday: 8 })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const writer = callerFor((await insertUser({ role: "writer" })).id);
    await expect(writer.writerAssignments.all()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      writer.settings.setTakeawayDeadline({ weekday: 2 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      anonymousCaller().writerAssignments.mine()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      callerFor((await insertUser()).id).writerAssignments.mine()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
