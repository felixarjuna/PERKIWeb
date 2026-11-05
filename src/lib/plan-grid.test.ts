import { describe, expect, it } from "vitest";
import {
  buildPlan,
  type PlanData,
  type PlanSchedule,
  planRows,
  regularGatherings,
} from "./plan-grid";
import { localTime, startOn } from "./schedule-team";

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 15:30 in Aachen on a `yyyy-MM-dd` day. */
const on = (iso: string) => {
  const [, year, month, date] = DAY.exec(iso) ?? [];
  return startOn({
    day: Number(date),
    month: Number(month),
    year: Number(year),
  });
};

const schedule = (overrides: Partial<PlanSchedule>): PlanSchedule => ({
  accommodation: null,
  cancelled: false,
  cleaningGroup: null,
  cookingGroup: null,
  date: on("2026-11-08"),
  flags: [],
  generated: {},
  id: 1,
  leader: null,
  multimedia: null,
  musician: null,
  noteWriter: null,
  preacher: null,
  published: true,
  title: "Service",
  type: "church_service",
  ...overrides,
});

const people = [
  { name: "Ana Putri", names: ["Ana"], userId: "ana", writeAs: "Ana" },
  { name: "Budi Santoso", names: [], userId: "budi", writeAs: "Budi Santoso" },
  { name: "Citra Dewi", names: [], userId: "citra", writeAs: "Citra" },
];

const data = (overrides: Partial<PlanData>): PlanData => ({
  assignments: [],
  away: [],
  before: [],
  people,
  pool: [],
  schedules: [],
  speakers: [],
  terms: [],
  ...overrides,
});

const active = (userId: string, role: PlanData["pool"][number]["role"]) => ({
  pausedUntil: null,
  role,
  scope: "both" as const,
  servedThisTerm: 0,
  status: "active" as const,
  userId,
});

const codes = (warnings: { code: string }[]) => warnings.map((w) => w.code);

describe("buildPlan", () => {
  it("warns about a liturgist whose group cooks that day, matched through a spelling", () => {
    const service = schedule({ cookingGroup: "Group 3", leader: "Ana" });
    const plan = buildPlan(
      data({
        pool: [{ ...active("ana", "liturgist"), scope: "church_service" }],
        schedules: [service],
        terms: [
          {
            groups: [
              {
                members: [{ name: "Ana Putri", userId: "ana" }],
                name: "Group 3",
              },
            ],
            startsOn: "2026-04-01",
          },
        ],
      })
    );
    expect(plan.cell(service, "leader")).toMatchObject({
      userId: "ana",
      value: "Ana",
    });
    expect(codes(plan.cell(service, "leader").warnings)).toEqual(["cooking"]);
  });

  it("warns about a paused musician and someone unavailable that day", () => {
    const service = schedule({ musician: "Budi Santoso", noteWriter: "Citra" });
    const plan = buildPlan(
      data({
        away: [
          {
            endsOn: "2026-11-10",
            note: "Exams",
            startsOn: "2026-11-01",
            userId: "citra",
          },
        ],
        pool: [
          { ...active("budi", "musician"), pausedUntil: "2026-11-30" },
          active("citra", "note_writer"),
        ],
        schedules: [service],
      })
    );
    expect(plan.cell(service, "musician").warnings).toEqual([
      { code: "paused", message: "Paused until 30 Nov." },
    ]);
    expect(plan.cell(service, "noteWriter").warnings).toEqual([
      { code: "unavailable", message: "Can't serve this day: Exams" },
    ]);
  });

  it("prefers the account a slot is linked to over the name", () => {
    const service = schedule({ musician: "B." });
    const plan = buildPlan(
      data({
        assignments: [{ role: "musician", scheduleId: 1, userId: "budi" }],
        pool: [{ ...active("budi", "musician"), scope: "bible_study" }],
        schedules: [service],
      })
    );
    expect(codes(plan.cell(service, "musician").warnings)).toEqual(["scope"]);
  });

  it("keeps a name without an account and warns about nothing it can't know", () => {
    const service = schedule({ musician: "Guest Player" });
    const plan = buildPlan(data({ schedules: [service] }));
    expect(plan.cell(service, "musician")).toEqual({
      userId: null,
      value: "Guest Player",
      warnings: [],
    });
  });

  it("warns about two slots on one day and a role served the week before", () => {
    const first = schedule({ date: on("2026-11-01"), id: 1, musician: "Ana" });
    const second = schedule({
      date: on("2026-11-08"),
      id: 2,
      musician: "Ana",
      noteWriter: "Ana",
    });
    const plan = buildPlan(
      data({
        before: [{ day: "2026-10-28", role: "note_writer", userId: "ana" }],
        pool: [active("ana", "musician"), active("ana", "note_writer")],
        schedules: [first, second],
      })
    );
    expect(
      plan.cell(second, "musician").warnings.map((w) => w.message)
    ).toEqual([
      "Also serves as note writer this day.",
      "Served as musician the week before (1 Nov).",
    ]);
    expect(plan.cell(first, "musician").warnings).toEqual([]);
    // Eleven days earlier is more than a week.
    expect(codes(plan.cell(second, "noteWriter").warnings)).toEqual([
      "same_day",
    ]);
  });

  it("counts a slot from before the month for the week before", () => {
    const early = schedule({
      date: on("2026-11-03"),
      id: 3,
      noteWriter: "Ana",
    });
    const plan = buildPlan(
      data({
        before: [{ day: "2026-10-28", role: "note_writer", userId: "ana" }],
        pool: [active("ana", "note_writer")],
        schedules: [early],
      })
    );
    expect(codes(plan.cell(early, "noteWriter").warnings)).toEqual([
      "week_before",
    ]);
  });

  it("warns on both group cells when one group cooks and cleans", () => {
    const service = schedule({
      cleaningGroup: "Group 2",
      cookingGroup: "Group 2",
    });
    const plan = buildPlan(data({ schedules: [service] }));
    expect(codes(plan.cell(service, "cookingGroup").warnings)).toEqual([
      "cooks_and_cleans",
    ]);
    expect(codes(plan.cell(service, "cleaningGroup").warnings)).toEqual([
      "cooks_and_cleans",
    ]);
  });

  it("has no warnings on a cancelled gathering, which doesn't count as serving", () => {
    const cancelled = schedule({
      cancelled: true,
      date: on("2026-11-01"),
      id: 1,
      musician: "Ana",
    });
    const next = schedule({ date: on("2026-11-08"), id: 2, musician: "Ana" });
    const plan = buildPlan(
      data({ pool: [active("ana", "musician")], schedules: [cancelled, next] })
    );
    expect(plan.cell(cancelled, "musician").warnings).toEqual([]);
    expect(plan.cell(next, "musician").warnings).toEqual([]);
  });

  it("offers the pool least recently served first, those in scope apart from the rest", () => {
    const earlier = schedule({
      date: on("2026-11-01"),
      id: 1,
      musician: "Ana",
    });
    const service = schedule({ date: on("2026-11-15"), id: 2 });
    const plan = buildPlan(
      data({
        before: [{ day: "2026-10-04", role: "musician", userId: "citra" }],
        pool: [
          { ...active("ana", "musician"), servedThisTerm: 4 },
          { ...active("budi", "musician"), status: "backup" },
          active("citra", "musician"),
          active("ana", "note_writer"),
          { ...active("budi", "note_writer"), scope: "bible_study" },
        ],
        schedules: [earlier, service],
      })
    );
    const musicians = plan.options(service, "musician");
    expect(
      musicians.inScope.map((o) => [
        o.name,
        o.lastDay,
        o.note,
        o.servedThisTerm,
      ])
    ).toEqual([
      ["Budi Santoso", null, "Backup", 0],
      ["Citra", "2026-10-04", null, 0],
      ["Ana", "2026-11-01", null, 4],
    ]);
    expect(musicians.elsewhere).toEqual([]);
    const writers = plan.options(service, "noteWriter");
    expect(writers.inScope.map((o) => o.name)).toEqual(["Ana"]);
    expect(writers.elsewhere.map((o) => [o.name, codes(o.warnings)])).toEqual([
      ["Budi Santoso", ["scope"]],
    ]);
  });

  it("shows the warnings a person would get in the slot before they're picked", () => {
    const service = schedule({ cookingGroup: "Group 1" });
    const plan = buildPlan(
      data({
        pool: [{ ...active("ana", "liturgist"), pausedUntil: "2026-11-08" }],
        schedules: [service],
        terms: [
          {
            groups: [
              { members: [{ name: "Ana", userId: "ana" }], name: "Group 1" },
            ],
            startsOn: "2026-04-01",
          },
        ],
      })
    );
    const [ana] = plan.options(service, "leader").inScope;
    expect(ana?.note).toBe("Paused");
    expect(codes(ana?.warnings ?? [])).toEqual(["paused", "cooking"]);
  });

  it("offers the groups of the term in force that day", () => {
    const terms = [
      { groups: [{ members: [], name: "Group 1" }], startsOn: "2026-04-01" },
      { groups: [{ members: [], name: "Group A" }], startsOn: "2026-11-05" },
    ];
    const plan = buildPlan(data({ terms }));
    expect(plan.groupNames(schedule({ date: on("2026-11-01") }))).toEqual([
      "Group 1",
    ]);
    expect(plan.groupNames(schedule({ date: on("2026-11-08") }))).toEqual([
      "Group A",
    ]);
  });
});

describe("regularGatherings", () => {
  it("lays out every Saturday at 15:30: PA Besar on the 1st, 3rd and 5th, a service on the 2nd and 4th", () => {
    // January 2026 has five Saturdays: 3, 10, 17, 24, 31.
    expect(
      regularGatherings("2026-01", 1).map((g) => [g.day, g.type, g.title])
    ).toEqual([
      ["2026-01-03", "bible_study", "Penelaahan Alkitab"],
      ["2026-01-10", "church_service", "Kebaktian"],
      ["2026-01-17", "bible_study", "Penelaahan Alkitab"],
      ["2026-01-24", "church_service", "Kebaktian"],
      ["2026-01-31", "bible_study", "Penelaahan Alkitab"],
    ]);
    expect(
      localTime(regularGatherings("2026-01", 1)[0]?.date ?? new Date())
    ).toBe("15:30");
  });

  it("covers several months, counting Saturdays within each month", () => {
    const days = regularGatherings("2026-01", 2);
    expect(days).toHaveLength(9);
    expect(days[5]).toMatchObject({ day: "2026-02-07", type: "bible_study" });
    expect(days[6]).toMatchObject({
      day: "2026-02-14",
      type: "church_service",
    });
  });

  it("keeps 15:30 in Aachen across the clock change", () => {
    const [april] = regularGatherings("2026-04", 1);
    expect(april?.day).toBe("2026-04-04");
    expect(localTime(april?.date ?? new Date())).toBe("15:30");
  });
});

describe("planRows", () => {
  it("lists stored gatherings and suggests the regular days that have none, in date order", () => {
    const stored = schedule({
      date: on("2026-01-10"),
      id: 4,
      title: "Retreat",
    });
    const extra = schedule({
      date: on("2026-01-14"),
      id: 5,
      title: "Prayer night",
      type: "bible_study",
    });
    const rows = planRows([stored, extra], regularGatherings("2026-01", 1));
    expect(
      rows.map((row) => [row.key, row.suggested, row.schedule.title])
    ).toEqual([
      ["new 2026-01-03", true, "Penelaahan Alkitab"],
      ["4", false, "Retreat"],
      ["5", false, "Prayer night"],
      ["new 2026-01-17", true, "Penelaahan Alkitab"],
      ["new 2026-01-24", true, "Kebaktian"],
      ["new 2026-01-31", true, "Penelaahan Alkitab"],
    ]);
    // A suggested row is empty, so nothing on it warns.
    const plan = buildPlan(data({ schedules: [stored, extra] }));
    const [first] = rows;
    expect(first && plan.cell(first.schedule, "leader")).toEqual({
      userId: null,
      value: null,
      warnings: [],
    });
  });
});
