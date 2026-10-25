import { afterEach, describe, expect, it, vi } from "vitest";
import { nameLinks, servingPool, unavailability } from "~/lib/db/schema/schema";
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

const addService = (date: string, overrides: Partial<typeof service> = {}) =>
  db.transaction((tx) =>
    insertSchedule(tx, { ...service, date: new Date(date), ...overrides })
  );

/** Ana plays music, and Saturdays 31 Oct, 7 Nov and 14 Nov have no musician. */
const setup = async () => {
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  const ana = await insertUser({ name: "Ana Putri" });
  const mita = await insertUser({ name: "Mita", role: "mita" });
  await testDb
    .insert(servingPool)
    .values({ role: "musician", scope: "both", userId: ana.id });
  const saturday = await addService("2026-10-31T14:30:00Z");
  await addService("2026-11-07T14:30:00Z", { title: "Second service" });
  await addService("2026-11-14T14:30:00Z", { title: "Third service" });
  return { ana, mita, saturdayId: saturday?.id ?? 0 };
};

describe("unavailability", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is for signed-in members, and the day list for staff only", async () => {
    const { ana } = await setup();
    await expect(anonymousCaller().unavailability.mine()).rejects.toMatchObject(
      { code: "UNAUTHORIZED" }
    );
    await expect(
      anonymousCaller().unavailability.add({
        endsOn: "2026-10-31",
        startsOn: "2026-10-31",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      callerFor(ana.id).unavailability.onDay({ day: "2026-10-31" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("hides the marked Saturdays from the member's open slots and shows staff the note", async () => {
    const { ana, mita } = await setup();
    const api = callerFor(ana.id);
    await api.unavailability.add({
      endsOn: "2026-10-31",
      note: "Family visit",
      startsOn: "2026-10-31",
    });
    await api.unavailability.add({
      endsOn: "2026-11-14",
      startsOn: "2026-11-14",
    });

    const open = await api.schedules.openSlots();
    expect(open.slots.map((slot) => slot.title)).toEqual(["Second service"]);

    const staff = callerFor(mita.id).unavailability;
    expect(await staff.onDay({ day: "2026-10-31" })).toEqual([
      {
        endsOn: "2026-10-31",
        name: "Ana Putri",
        names: ["Ana Putri"],
        note: "Family visit",
        startsOn: "2026-10-31",
      },
    ]);
    expect(await staff.onDay({ day: "2026-11-14" })).toMatchObject([
      { name: "Ana Putri", note: null },
    ]);
    expect(await staff.onDay({ day: "2026-11-07" })).toEqual([]);
  });

  it("refuses to let the member take a slot on a day they marked", async () => {
    const { ana, saturdayId } = await setup();
    const api = callerFor(ana.id);
    await api.unavailability.add({
      endsOn: "2026-11-01",
      startsOn: "2026-10-30",
    });

    const { slots } = await api.schedules.openSlots();
    expect(slots[0]?.title).toBe("Second service");
    await expect(
      api.schedules.takeSlot({ role: "musician", scheduleId: saturdayId })
    ).rejects.toMatchObject({
      message: "You marked this day as one you can't serve.",
    });
  });

  it("keeps a slot the member already holds and tells them about it", async () => {
    const { ana, mita } = await setup();
    await testDb.insert(nameLinks).values({ name: "ana", userId: ana.id });
    await addService("2026-11-21T14:30:00Z", {
      musician: "Ana",
      title: "Fourth service",
    });

    const result = await callerFor(ana.id).unavailability.add({
      endsOn: "2026-11-21",
      startsOn: "2026-11-21",
    });
    expect(result.assigned).toEqual([
      {
        date: new Date("2026-11-21T14:30:00Z"),
        role: "musician",
        title: "Fourth service",
      },
    ]);
    // The schedule still names her; staff match the spelling it uses.
    const [day] = await callerFor(mita.id).unavailability.onDay({
      day: "2026-11-21",
    });
    expect(day?.names).toEqual(
      expect.arrayContaining(["Ana Putri", "ana", "Ana"])
    );
  });

  it("lists the member's own days from today on, and only they remove them", async () => {
    const { ana, mita } = await setup();
    const api = callerFor(ana.id);
    const { id } = await api.unavailability.add({
      endsOn: "2026-11-08",
      note: "Exams",
      startsOn: "2026-11-02",
    });
    await testDb
      .insert(unavailability)
      .values({ endsOn: "2026-10-01", startsOn: "2026-10-01", userId: ana.id });

    expect((await api.unavailability.mine()).ranges).toEqual([
      { endsOn: "2026-11-08", id, note: "Exams", startsOn: "2026-11-02" },
    ]);
    expect((await api.unavailability.mine()).inPool).toBe(true);
    expect((await callerFor(mita.id).unavailability.mine()).ranges).toEqual([]);

    await expect(
      callerFor(mita.id).unavailability.remove({ id })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await api.unavailability.remove({ id });
    expect((await api.unavailability.mine()).ranges).toEqual([]);
  });

  it("refuses days that have passed or a backwards range", async () => {
    const { ana } = await setup();
    const api = callerFor(ana.id);
    await expect(
      api.unavailability.add({ endsOn: "2026-10-20", startsOn: "2026-10-20" })
    ).rejects.toMatchObject({ message: "Those days have already passed." });
    await expect(
      api.unavailability.add({ endsOn: "2026-11-01", startsOn: "2026-11-05" })
    ).rejects.toMatchObject({
      message: "The last day comes before the first.",
    });
  });
});
