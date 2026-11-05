import { asc, eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "~/app/api/calendar/[token]/route";
import {
  groups,
  groupTerms,
  schedules,
  servingPool,
} from "~/lib/db/schema/schema";
import { localDay } from "~/lib/schedule-team";
import { db } from "~/server";
import { insertSchedule } from "~/server/schedule-assignments";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

// Sunday 25 Oct 2026, noon in Aachen.
const NOW = new Date("2026-10-25T11:00:00Z");

const NOVEMBER = { from: "2026-11", through: "2026-11" } as const;
const NOVEMBER_DATES = {
  before: new Date("2026-12-01T00:00:00Z"),
  from: new Date("2026-11-01T00:00:00Z"),
};

/** A mita, a pool that can fill every slot of November, and three groups. */
const setup = async () => {
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  const mita = await insertUser({ name: "Mita", role: "mita" });
  const member = await insertUser({ name: "Member" });
  const names = ["Ana", "Budi", "Citra", "Dewi", "Eko", "Fani"];
  const people = await Promise.all(names.map((name) => insertUser({ name })));
  const [ana, budi, citra, dewi, eko, fani] = people.map((p) => p.id) as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  await testDb.insert(servingPool).values([
    { role: "liturgist", scope: "church_service", userId: ana },
    { role: "liturgist", scope: "church_service", userId: budi },
    { role: "leader", scope: "bible_study", userId: citra },
    { role: "leader", scope: "bible_study", userId: dewi },
    { role: "musician", scope: "both", userId: eko },
    { role: "musician", scope: "both", userId: fani },
    { role: "note_writer", scope: "both", userId: ana },
    { role: "note_writer", scope: "both", userId: citra },
    { role: "multimedia", scope: "church_service", userId: dewi },
    { role: "accommodation", scope: "church_service", userId: budi },
  ]);
  const [term] = await testDb
    .insert(groupTerms)
    .values({ startsOn: "2026-04-01" })
    .returning();
  await testDb.insert(groups).values(
    ["Group 1", "Group 2", "Group 3"].map((name) => ({
      name,
      termId: term?.id ?? 0,
    }))
  );
  return { ana, budi, citra, dewi, eko, fani, member, mita };
};

const november = () =>
  testDb
    .select()
    .from(schedules)
    .where(eq(schedules.published, false))
    .orderBy(asc(schedules.date));

const fetchFeed = (path: string) =>
  GET(new Request(`https://perki.example${path}`), {
    params: Promise.resolve({ token: path.split("/").at(-1) ?? "" }),
  });

describe("schedule generator", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is for staff only", async () => {
    const member = await insertUser({ name: "Member" });
    const api = callerFor(member.id);
    await expect(
      api.schedules.generate({ ...NOVEMBER, mode: "fill" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(api.schedules.publishRange(NOVEMBER)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      api.schedules.lockPlanSlot({ column: "musician", scheduleId: 1 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      anonymousCaller().schedules.generate({ ...NOVEMBER, mode: "fill" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("adds November's Saturdays as drafts with every slot filled and a reason for each", async () => {
    const { mita } = await setup();
    const result = await callerFor(mita.id).schedules.generate({
      ...NOVEMBER,
      mode: "fill",
    });
    const rows = await november();
    expect(rows.map((row) => [localDay(row.date), row.type])).toEqual([
      ["2026-11-07", "bible_study"],
      ["2026-11-14", "church_service"],
      ["2026-11-21", "bible_study"],
      ["2026-11-28", "church_service"],
    ]);
    expect(result.open).toBe(0);
    // Two Bible studies × 4 slots, two services × 7 (the preacher stays open).
    expect(result.filled).toBe(22);
    for (const row of rows) {
      expect(row.preacher).toBeNull();
      const columns =
        row.type === "church_service"
          ? [
              "leader",
              "musician",
              "multimedia",
              "accommodation",
              "noteWriter",
              "cookingGroup",
              "cleaningGroup",
            ]
          : ["leader", "musician", "noteWriter", "cleaningGroup"];
      expect(Object.keys(row.generated).sort()).toEqual([...columns].sort());
      for (const column of columns) {
        expect(row[column as keyof typeof row]).toBeTruthy();
      }
    }
    expect(rows.map((row) => [row.cookingGroup, row.cleaningGroup])).toEqual([
      [null, "Group 1"],
      ["Group 1", "Group 2"],
      [null, "Group 3"],
      ["Group 2", "Group 1"],
    ]);
    expect(rows[1]?.generated.cookingGroup?.reason).toBe(
      "First in the cooking rotation this term."
    );
    expect(rows[3]?.generated.cleaningGroup?.reason).toBe(
      "Next in the cleaning rotation after Group 3."
    );
  });

  it("keeps drafts from members and the public until the range is published", async () => {
    const { ana, dewi, member, mita } = await setup();
    const staff = callerFor(mita.id);
    await staff.schedules.generate({ ...NOVEMBER, mode: "fill" });
    const [first, second] = await november();
    const hers = await callerFor(ana).calendarFeed.regenerate();
    // An open slot in a draft isn't offered either.
    await staff.schedules.setPlanSlot({
      column: "multimedia",
      name: null,
      scheduleId: second?.id ?? 0,
    });

    const anyone = anonymousCaller();
    expect(await anyone.schedules.inRange(NOVEMBER_DATES)).toEqual([]);
    expect(
      (await anyone.schedules.list({ ...NOVEMBER_DATES, limit: 10 })).items
    ).toEqual([]);
    expect(await anyone.schedules.months()).toEqual([]);
    await expect(
      anyone.schedules.getGathering({ id: first?.id ?? 0 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      anyone.schedules.getScheduleById({ id: first?.id ?? 0 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    // Asking for drafts only works for staff.
    expect(
      await callerFor(member.id).schedules.inRange({
        ...NOVEMBER_DATES,
        drafts: true,
      })
    ).toEqual([]);
    expect(
      await staff.schedules.inRange({ ...NOVEMBER_DATES, drafts: true })
    ).toHaveLength(4);
    expect(
      (await staff.schedules.list({ ...NOVEMBER_DATES, limit: 10 })).items
    ).toEqual([]);
    expect(
      await staff.schedules.getGathering({ id: first?.id ?? 0 })
    ).toMatchObject({ published: false });

    const duties = await callerFor(ana).schedules.myDuties();
    expect(duties.upcoming).toEqual([]);
    expect((await callerFor(dewi).schedules.openSlots()).slots).toEqual([]);
    await expect(
      callerFor(dewi).schedules.takeSlot({
        role: "multimedia",
        scheduleId: second?.id ?? 0,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await (await fetchFeed(hers.path)).text()).not.toContain(
      "BEGIN:VEVENT"
    );

    expect(await staff.schedules.publishRange(NOVEMBER)).toEqual({
      published: 4,
    });

    expect(await anyone.schedules.inRange(NOVEMBER_DATES)).toHaveLength(4);
    expect(
      (await anyone.schedules.list({ ...NOVEMBER_DATES, limit: 10 })).items
    ).toHaveLength(4);
    expect(await anyone.schedules.months()).toEqual(["2026-11"]);
    expect((await callerFor(ana).schedules.myDuties()).upcoming).not.toEqual(
      []
    );
    expect(
      (await callerFor(dewi).schedules.openSlots()).slots.map(
        (slot) => slot.scheduleId
      )
    ).toEqual([second?.id]);
    expect(await (await fetchFeed(hers.path)).text()).toContain("BEGIN:VEVENT");
    // Nothing left to publish.
    expect(await staff.schedules.publishRange(NOVEMBER)).toEqual({
      published: 0,
    });
  });

  it("regenerate keeps locked picks and manual picks, refills the rest", async () => {
    const { budi, mita } = await setup();
    const staff = callerFor(mita.id);
    await staff.schedules.generate({ ...NOVEMBER, mode: "fill" });
    const [, service] = await november();
    const id = service?.id ?? 0;
    const lockedMusician = service?.musician;
    await staff.schedules.lockPlanSlot({ column: "musician", scheduleId: id });
    await staff.schedules.setPlanSlot({
      column: "noteWriter",
      name: "Budi",
      scheduleId: id,
      userId: budi,
    });
    // Emptied generated slot: plain "fill" fills it again.
    await staff.schedules.setPlanSlot({
      column: "leader",
      name: null,
      scheduleId: id,
    });

    await staff.schedules.generate({ ...NOVEMBER, mode: "regenerate" });

    const [after] = await testDb
      .select()
      .from(schedules)
      .where(eq(schedules.id, id));
    expect(after?.musician).toBe(lockedMusician);
    expect(after?.generated.musician).toMatchObject({ locked: true });
    expect(after?.noteWriter).toBe("Budi");
    expect(after?.generated.noteWriter).toBeUndefined();
    expect(after?.leader).toBeTruthy();
    expect(after?.generated.leader?.reason).toBeTruthy();
    expect(after?.generated.leader?.locked).toBeUndefined();
    await expect(
      staff.schedules.lockPlanSlot({ column: "noteWriter", scheduleId: id })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("leaves published gatherings as they are and adds no second gathering on a day", async () => {
    const { mita } = await setup();
    const [stored] = await db.transaction(async (tx) => [
      await insertSchedule(tx, {
        bibleVerse: "",
        cleaningGroup: "",
        date: new Date("2026-11-07T14:30:00Z"),
        description: "",
        leader: "",
        musician: "",
        noteWriter: "",
        title: "Imported",
        type: "bible_study",
      }),
    ]);
    await callerFor(mita.id).schedules.generate({ ...NOVEMBER, mode: "fill" });
    const [imported] = await testDb
      .select()
      .from(schedules)
      .where(eq(schedules.id, stored?.id ?? 0));
    expect(imported).toMatchObject({
      generated: {},
      leader: "",
      published: true,
    });
    expect((await november()).map((row) => localDay(row.date))).toEqual([
      "2026-11-14",
      "2026-11-21",
      "2026-11-28",
    ]);
  });

  it("refuses a range that ends before it starts", async () => {
    const { mita } = await setup();
    await expect(
      callerFor(mita.id).schedules.publishRange({
        from: "2026-12",
        through: "2026-11",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
