import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  groupMembers,
  groups,
  groupTerms,
  schedules,
  servingPool,
} from "~/lib/db/schema/schema";
import { db } from "~/server";
import { insertSchedule } from "~/server/schedule-assignments";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

// Sunday 25 Oct 2026, noon in Aachen.
const NOW = new Date("2026-10-25T11:00:00Z");

const service = {
  accommodation: "Ari",
  bibleVerse: "Roma 4:1-12",
  cleaningGroup: "Group 2",
  cookingGroup: "Group 1",
  description: "Weekly gathering",
  leader: "Lia",
  multimedia: "Mo",
  musician: "-",
  noteWriter: "Nia",
  preacher: "Pdt. Guest",
  title: "Saturday service",
  type: "church_service" as const,
};

/** Saturday's service, with an empty musician slot the admin form can't write. */
const setup = async (overrides: Partial<typeof service> = {}) => {
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  const ana = await insertUser({ name: "Ana Putri" });
  // The liturgist already has an account, so the schedule links her slot.
  const lia = await insertUser({ name: "Lia" });
  const saturday = await db.transaction((tx) =>
    insertSchedule(tx, {
      ...service,
      date: new Date("2026-10-31T14:30:00Z"),
      ...overrides,
    })
  );
  return { ana, lia, scheduleId: saturday?.id ?? 0 };
};

const joinPool = (
  userId: string,
  role: string,
  extra: Partial<typeof servingPool.$inferInsert> = {}
) =>
  testDb.insert(servingPool).values({ role, scope: "both", userId, ...extra });

/** A current group term where `userId` is in `name`. */
const inGroup = async (userId: string, name: string) => {
  const [term] = await testDb
    .insert(groupTerms)
    .values({ startsOn: "2026-04-01" })
    .returning();
  const [group] = await testDb
    .insert(groups)
    .values({ name, termId: term?.id ?? 0 })
    .returning();
  await testDb
    .insert(groupMembers)
    .values({ groupId: group?.id ?? 0, name: "Ana", position: 0, userId });
};

describe("open slots", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("are for signed-in members", async () => {
    await expect(anonymousCaller().schedules.openSlots()).rejects.toMatchObject(
      { code: "UNAUTHORIZED" }
    );
    await expect(
      anonymousCaller().schedules.takeSlot({ role: "musician", scheduleId: 1 })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("says when the member isn't active in any role", async () => {
    const { ana } = await setup();
    expect(await callerFor(ana.id).schedules.openSlots()).toEqual({
      active: false,
      slots: [],
    });
  });

  it("lets an active musician take Saturday's empty musician slot", async () => {
    const { ana, scheduleId } = await setup();
    await joinPool(ana.id, "musician");
    const api = callerFor(ana.id);

    const open = await api.schedules.openSlots();
    expect(open.slots).toMatchObject([
      { refusal: null, role: "musician", scheduleId, warning: null },
    ]);

    await api.schedules.takeSlot({ role: "musician", scheduleId });

    // The schedule names them, linked to their account.
    const [gathering] = await anonymousCaller().schedules.inRange({
      before: new Date("2026-11-01T00:00:00Z"),
      from: new Date("2026-10-31T00:00:00Z"),
    });
    expect(gathering?.musician).toBe("Ana Putri");
    expect(gathering?.team).toContainEqual(
      expect.objectContaining({ name: "Ana Putri", role: "musician" })
    );
    // Their duties show it, and it's no longer open.
    const duties = await api.schedules.myDuties();
    expect(duties.upcoming).toMatchObject([
      { duties: [{ role: "musician" }], id: scheduleId },
    ]);
    expect((await api.schedules.openSlots()).slots).toEqual([]);
    // Taking it twice is refused.
    await expect(
      api.schedules.takeSlot({ role: "musician", scheduleId })
    ).rejects.toMatchObject({ message: "You're already in this slot." });
  });

  it("keeps the other slots' account links when one is taken", async () => {
    const { ana, lia, scheduleId } = await setup();
    await joinPool(ana.id, "musician");
    await callerFor(ana.id).schedules.takeSlot({
      role: "musician",
      scheduleId,
    });
    const duties = await callerFor(lia.id).schedules.myDuties();
    expect(duties.upcoming).toMatchObject([
      { duties: [{ role: "liturgist" }], id: scheduleId },
    ]);
  });

  it("refuses a paused member with a clear message", async () => {
    const { ana, scheduleId } = await setup();
    await joinPool(ana.id, "musician", { pausedUntil: "2026-11-15" });
    const api = callerFor(ana.id);

    expect((await api.schedules.openSlots()).slots).toMatchObject([
      {
        refusal: "You're paused until 15 Nov, so you can't take this slot.",
        scheduleId,
      },
    ]);
    await expect(
      api.schedules.takeSlot({ role: "musician", scheduleId })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "You're paused until 15 Nov, so you can't take this slot.",
    });
  });

  it("refuses a member whose group cooks that day", async () => {
    const { ana, scheduleId } = await setup();
    await joinPool(ana.id, "musician");
    await inGroup(ana.id, "Group 1");

    await expect(
      callerFor(ana.id).schedules.takeSlot({ role: "musician", scheduleId })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Your group cooks that day, so you can't serve as musician too.",
    });
  });

  it("leaves out cancelled gatherings and refuses their slots", async () => {
    const { ana, scheduleId } = await setup();
    await joinPool(ana.id, "musician");
    await testDb
      .update(schedules)
      .set({ cancelled: true })
      .where(eq(schedules.id, scheduleId));
    const api = callerFor(ana.id);

    expect(await api.schedules.openSlots()).toEqual({
      active: true,
      slots: [],
    });
    await expect(
      api.schedules.takeSlot({ role: "musician", scheduleId })
    ).rejects.toMatchObject({ message: "This gathering is cancelled." });
  });

  it("refuses a slot someone else has taken", async () => {
    const { ana, scheduleId } = await setup();
    const budi = await insertUser({ name: "Budi" });
    await joinPool(ana.id, "musician");
    await joinPool(budi.id, "musician");
    await callerFor(budi.id).schedules.takeSlot({
      role: "musician",
      scheduleId,
    });

    await expect(
      callerFor(ana.id).schedules.takeSlot({ role: "musician", scheduleId })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Budi has already taken this slot.",
    });
  });

  it("refuses roles the member isn't active in, and lists only their roles and scope", async () => {
    const { ana, scheduleId } = await setup();
    await joinPool(ana.id, "musician", { scope: "bible_study" });
    await joinPool(ana.id, "note_writer", { status: "backup" });
    const api = callerFor(ana.id);

    // Only a Bible-study musician, and a backup note writer: nothing to take.
    expect(await api.schedules.openSlots()).toEqual({
      active: true,
      slots: [],
    });
    await expect(
      api.schedules.takeSlot({ role: "musician", scheduleId })
    ).rejects.toMatchObject({
      message: "You serve as musician at Bible studies only.",
    });
    await expect(
      api.schedules.takeSlot({ role: "multimedia", scheduleId })
    ).rejects.toMatchObject({ message: "Mo has already taken this slot." });
  });

  it("warns about a second slot that day but allows it", async () => {
    const { ana, scheduleId } = await setup({ noteWriter: "Ana Putri" });
    await joinPool(ana.id, "musician");
    const api = callerFor(ana.id);

    expect((await api.schedules.openSlots()).slots).toMatchObject([
      {
        refusal: null,
        warning: "You already serve as note writer that day.",
      },
    ]);
    await expect(
      api.schedules.takeSlot({ role: "musician", scheduleId })
    ).resolves.toMatchObject({
      warning: "You already serve as note writer that day.",
    });
  });
});
