import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  groupMembers,
  groups,
  groupTerms,
  nameLinks,
  scheduleAssignments,
  servingPool,
  unavailability,
} from "~/lib/db/schema/schema";
import { buildPlan } from "~/lib/plan-grid";
import { db } from "~/server";
import { insertSchedule } from "~/server/schedule-assignments";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

// Sunday 25 Oct 2026, noon in Aachen.
const NOW = new Date("2026-10-25T11:00:00Z");

const service = {
  accommodation: "-",
  bibleVerse: "Roma 4:1-12",
  cleaningGroup: "Group 2",
  cookingGroup: "Group 1",
  description: "Weekly gathering",
  leader: "-",
  multimedia: "-",
  musician: "-",
  noteWriter: "-",
  preacher: "Pdt. Guest",
  title: "Saturday service",
  type: "church_service" as const,
};

/** Two November services, a mita, and Ana (liturgist, in the cooking group). */
const setup = async () => {
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  const mita = await insertUser({ name: "Mita", role: "mita" });
  const ana = await insertUser({ name: "Ana Putri" });
  const budi = await insertUser({ name: "Budi Santoso" });
  const [first, second] = await db.transaction(async (tx) => [
    await insertSchedule(tx, {
      ...service,
      date: new Date("2026-11-07T14:30:00Z"),
    }),
    await insertSchedule(tx, {
      ...service,
      cookingGroup: "Group 3",
      date: new Date("2026-11-14T14:30:00Z"),
    }),
  ]);
  await testDb.insert(servingPool).values([
    { role: "liturgist", scope: "church_service", userId: ana.id },
    {
      pausedUntil: "2026-11-30",
      role: "musician",
      scope: "both",
      userId: budi.id,
    },
  ]);
  const [term] = await testDb
    .insert(groupTerms)
    .values({ startsOn: "2026-04-01" })
    .returning();
  const [group] = await testDb
    .insert(groups)
    .values({ name: "Group 1", termId: term?.id ?? 0 })
    .returning();
  await testDb
    .insert(groupMembers)
    .values({ groupId: group?.id ?? 0, name: "Ana", userId: ana.id });
  return {
    ana,
    budi,
    first: first?.id ?? 0,
    mita,
    second: second?.id ?? 0,
  };
};

describe("planning grid", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is for staff only", async () => {
    const member = await insertUser({ name: "Member" });
    await expect(
      anonymousCaller().schedules.plan({ month: "2026-11" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      callerFor(member.id).schedules.plan({ month: "2026-11" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      callerFor(member.id).schedules.setPlanSlot({
        column: "musician",
        name: "Ana",
        scheduleId: 1,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("fills a month: the public schedule shows the names, linked to the picked accounts", async () => {
    const { ana, budi, first, mita, second } = await setup();
    const api = callerFor(mita.id);

    await api.schedules.setPlanSlot({
      column: "leader",
      name: "Ana Putri",
      scheduleId: first,
      userId: ana.id,
    });
    // A paused musician is advice, never refused.
    await api.schedules.setPlanSlot({
      column: "musician",
      name: "Budi Santoso",
      scheduleId: first,
      userId: budi.id,
    });
    await api.schedules.setPlanSlot({
      column: "cookingGroup",
      name: "Group 2",
      scheduleId: second,
    });

    const week = await anonymousCaller().schedules.inRange({
      before: new Date("2026-11-15T00:00:00Z"),
      from: new Date("2026-11-07T00:00:00Z"),
    });
    expect(week.map((g) => [g.leader, g.musician, g.cookingGroup])).toEqual([
      ["Ana Putri", "Budi Santoso", "Group 1"],
      ["-", "-", "Group 2"],
    ]);
    expect(week[0]?.team).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Ana Putri", role: "liturgist" }),
        expect.objectContaining({ name: "Budi Santoso", role: "musician" }),
        // The rest of the team keeps its slots.
        expect.objectContaining({ name: "Pdt. Guest", role: "preacher" }),
      ])
    );
    const linked = await testDb
      .select()
      .from(scheduleAssignments)
      .where(eq(scheduleAssignments.scheduleId, first));
    expect(linked.find((row) => row.role === "liturgist")?.userId).toBe(ana.id);

    // The grid warns about the liturgist in the cooking group and the paused musician.
    const data = await api.schedules.plan({ month: "2026-11" });
    const plan = buildPlan(data);
    const [saturday] = data.schedules;
    if (!saturday) {
      throw new Error("Missing schedule");
    }
    expect(plan.cell(saturday, "leader").warnings.map((w) => w.code)).toEqual([
      "cooking",
    ]);
    expect(plan.cell(saturday, "musician").warnings).toEqual([
      { code: "paused", message: "Paused until 30 Nov." },
    ]);
  });

  it("resolves a typed name through name links, and empties a slot", async () => {
    const { ana, first, mita } = await setup();
    await testDb.insert(nameLinks).values({ name: "kak ana", userId: ana.id });
    const api = callerFor(mita.id);

    await api.schedules.setPlanSlot({
      column: "noteWriter",
      name: "Kak Ana",
      scheduleId: first,
    });
    const rows = await testDb
      .select()
      .from(scheduleAssignments)
      .where(eq(scheduleAssignments.scheduleId, first));
    expect(rows.find((row) => row.role === "note_writer")).toMatchObject({
      name: "Kak Ana",
      userId: ana.id,
    });

    await api.schedules.setPlanSlot({
      column: "noteWriter",
      name: null,
      scheduleId: first,
    });
    const [gathering] = await api.schedules.inRange({
      before: new Date("2026-11-08T00:00:00Z"),
      from: new Date("2026-11-07T00:00:00Z"),
    });
    expect(gathering?.noteWriter).toBe("");
    expect(gathering?.team.map((slot) => slot.role)).not.toContain(
      "note_writer"
    );
  });

  it("refuses a slot the gathering doesn't have", async () => {
    const { mita } = await setup();
    const study = await db.transaction((tx) =>
      insertSchedule(tx, {
        ...service,
        cookingGroup: undefined,
        date: new Date("2026-11-11T18:00:00Z"),
        preacher: undefined,
        type: "bible_study",
      })
    );
    await expect(
      callerFor(mita.id).schedules.setPlanSlot({
        column: "multimedia",
        name: "Ana",
        scheduleId: study?.id ?? 0,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns the pool, this term's counts, the days people can't serve and the group terms", async () => {
    const { ana, mita } = await setup();
    await testDb.insert(unavailability).values({
      endsOn: "2026-11-08",
      note: "Away",
      startsOn: "2026-11-06",
      userId: ana.id,
    });
    const data = await callerFor(mita.id).schedules.plan({ month: "2026-11" });
    expect(data.schedules).toHaveLength(2);
    expect(data.pool).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "liturgist",
          servedThisTerm: 0,
          userId: ana.id,
        }),
      ])
    );
    expect(data.away).toEqual([
      {
        endsOn: "2026-11-08",
        note: "Away",
        startsOn: "2026-11-06",
        userId: ana.id,
      },
    ]);
    expect(data.people).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: ana.id, writeAs: "Ana Putri" }),
      ])
    );
    expect(data.terms[0]?.groups[0]).toEqual({
      members: [{ name: "Ana", userId: ana.id }],
      name: "Group 1",
    });
  });
});
