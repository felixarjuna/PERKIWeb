import { describe, expect, it } from "vitest";
import { generatePlan, MIN_GAP_DAYS } from "./plan-generator";
import {
  buildPlan,
  columnRole,
  hasColumn,
  PLAN_COLUMNS,
  type PlanData,
  type PlanRow,
  type PlanSchedule,
  planRows,
  regularGatherings,
} from "./plan-grid";
import { localDay, startOn } from "./schedule-team";

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

const TODAY = "2026-10-25";
const BACKUP_REASON = /^Backup: nobody active is free/;

const schedule = (overrides: Partial<PlanSchedule>): PlanSchedule => ({
  accommodation: null,
  cancelled: false,
  cleaningGroup: null,
  cookingGroup: null,
  date: on("2026-11-14"),
  flags: [],
  generated: {},
  id: 1,
  leader: null,
  multimedia: null,
  musician: null,
  noteWriter: null,
  preacher: null,
  published: false,
  title: "Kebaktian",
  type: "church_service",
  ...overrides,
});

const row = (s: PlanSchedule, suggested = false): PlanRow => ({
  key: suggested ? `new ${localDay(s.date)}` : String(s.id),
  schedule: s,
  suggested,
});

type Entry = PlanData["pool"][number];

const entry = (
  userId: string,
  role: Entry["role"],
  overrides: Partial<Entry> = {}
): Entry => ({
  pausedUntil: null,
  role,
  scope: "both",
  servedThisTerm: 0,
  status: "active",
  userId,
  ...overrides,
});

const person = (userId: string) => ({
  name: userId,
  names: [],
  userId,
  writeAs: userId,
});

const data = (overrides: Partial<PlanData>): PlanData => {
  const pool = overrides.pool ?? [];
  return {
    assignments: [],
    away: [],
    before: [],
    people: [...new Set(pool.map((e) => e.userId))].map(person),
    pool,
    schedules: [],
    speakers: [],
    terms: [],
    ...overrides,
  };
};

const generate = (
  d: PlanData,
  rows: PlanRow[],
  mode: "fill" | "regenerate" = "fill"
) => generatePlan({ data: d, mode, rows, today: TODAY });

/** Who the generator put in one slot of one row. */
const picked = (
  result: ReturnType<typeof generatePlan>,
  rowKey: string,
  column: string
) =>
  result
    .find((r) => r.row.key === rowKey)
    ?.picks.find((p) => p.column === column);

const groupsTerm = (count: number, members: Record<string, string[]> = {}) => ({
  groups: Array.from({ length: count }, (_, index) => {
    const name = `Group ${index + 1}`;
    return {
      members: (members[name] ?? []).map((userId) => ({
        name: userId,
        userId,
      })),
      name,
    };
  }),
  startsOn: "2026-04-01",
});

describe("generatePlan: who may serve", () => {
  it("only picks people in the pool for that role", () => {
    const s = schedule({ type: "bible_study" });
    const result = generate(
      data({ pool: [entry("ana", "musician"), entry("budi", "note_writer")] }),
      [row(s)]
    );
    expect(picked(result, "1", "musician")?.name).toBe("ana");
    expect(picked(result, "1", "noteWriter")?.name).toBe("budi");
    expect(result[0]?.open).toContain("leader");
  });

  it("follows a Leader's Leads switch: a PA Besar leader never leads a service", () => {
    const service = schedule({ id: 1 });
    const study = schedule({
      date: on("2026-11-21"),
      id: 2,
      type: "bible_study",
    });
    const result = generate(
      data({
        pool: [
          entry("ana", "leader", { scope: "bible_study" }),
          entry("budi", "liturgist", { scope: "church_service" }),
        ],
      }),
      [row(service), row(study)]
    );
    expect(picked(result, "1", "leader")?.name).toBe("budi");
    expect(picked(result, "2", "leader")?.name).toBe("ana");
  });

  it("respects scope: a musician for Bible studies only isn't put on a service", () => {
    const result = generate(
      data({
        pool: [
          entry("ana", "musician", { scope: "bible_study" }),
          entry("budi", "musician", { scope: "church_service" }),
        ],
      }),
      [row(schedule({}))]
    );
    expect(picked(result, "1", "musician")?.name).toBe("budi");
  });

  it("uses a backup only when no active person is free", () => {
    const pool = [
      entry("ana", "musician"),
      entry("budi", "musician", { status: "backup" }),
    ];
    expect(
      picked(generate(data({ pool }), [row(schedule({}))]), "1", "musician")
        ?.name
    ).toBe("ana");
    const away = data({
      away: [
        {
          endsOn: "2026-11-14",
          note: null,
          startsOn: "2026-11-14",
          userId: "ana",
        },
      ],
      pool,
    });
    const pick = picked(generate(away, [row(schedule({}))]), "1", "musician");
    expect(pick?.name).toBe("budi");
    expect(pick?.reason).toMatch(BACKUP_REASON);
  });

  it("skips people paused that day and days they marked unavailable", () => {
    const result = generate(
      data({
        away: [
          {
            endsOn: "2026-11-20",
            note: "Exams",
            startsOn: "2026-11-10",
            userId: "budi",
          },
        ],
        pool: [
          entry("ana", "musician", { pausedUntil: "2026-11-14" }),
          entry("budi", "musician"),
          entry("citra", "musician", { servedThisTerm: 5 }),
        ],
      }),
      [row(schedule({}))]
    );
    expect(picked(result, "1", "musician")?.name).toBe("citra");
  });

  it("never gives a liturgist or musician a slot while their group cooks", () => {
    const result = generate(
      data({
        pool: [
          entry("ana", "liturgist"),
          entry("budi", "liturgist", { servedThisTerm: 3 }),
          entry("ana", "note_writer"),
        ],
        terms: [groupsTerm(2, { "Group 1": ["ana"] })],
      }),
      [row(schedule({ cookingGroup: "Group 1" }))]
    );
    expect(picked(result, "1", "leader")?.name).toBe("budi");
    // Note writing isn't affected by cooking.
    expect(picked(result, "1", "noteWriter")?.name).toBe("ana");
  });

  it("gives nobody two slots on one day", () => {
    const result = generate(
      data({ pool: [entry("ana", "musician"), entry("ana", "note_writer")] }),
      [row(schedule({}))]
    );
    expect(picked(result, "1", "musician")?.name).toBe("ana");
    expect(picked(result, "1", "noteWriter")).toBeUndefined();
    expect(result[0]?.open).toContain("noteWriter");
  });

  it(`keeps at least ${MIN_GAP_DAYS} days between two slots in one role`, () => {
    const first = schedule({ id: 1, musician: "ana", published: true });
    const second = schedule({ date: on("2026-11-21"), id: 2 });
    const third = schedule({ date: on("2026-11-28"), id: 3 });
    const result = generate(
      data({
        pool: [
          entry("ana", "musician"),
          entry("budi", "musician", { servedThisTerm: 9 }),
        ],
      }),
      [row(first), row(second), row(third)]
    );
    expect(picked(result, "2", "musician")?.name).toBe("budi");
    expect(picked(result, "3", "musician")?.name).toBe("ana");
  });
});

describe("generatePlan: who goes first", () => {
  it("balances each role across the term: fewest slots first, planned ones counted", () => {
    const rows = ["2026-11-07", "2026-11-21", "2026-12-05", "2026-12-19"].map(
      (day, index) =>
        row(schedule({ date: on(day), id: index + 1, type: "bible_study" }))
    );
    const result = generate(
      data({
        pool: [
          entry("ana", "note_writer", { servedThisTerm: 2 }),
          entry("budi", "note_writer"),
          entry("citra", "note_writer", { servedThisTerm: 1 }),
        ],
      }),
      rows
    );
    expect(
      ["1", "2", "3", "4"].map((key) => picked(result, key, "noteWriter")?.name)
    ).toEqual(["budi", "citra", "budi", "ana"]);
    expect(picked(result, "1", "noteWriter")?.reason).toBe(
      "Fewest this term (0×); not served yet."
    );
  });

  it("puts the least recently served first when counts are equal, and says so", () => {
    const result = generate(
      data({
        before: [
          { day: "2026-10-17", role: "musician", userId: "ana" },
          { day: "2026-10-10", role: "musician", userId: "budi" },
        ],
        pool: [entry("ana", "musician"), entry("budi", "musician")],
      }),
      [row(schedule({}))]
    );
    expect(picked(result, "1", "musician")).toMatchObject({
      name: "budi",
      reason: "Least recently served; last on 10 Oct.",
      userId: "budi",
    });
  });
});

describe("generatePlan: order within a day", () => {
  it("fills the slot with the fewest people free first", () => {
    const result = generate(
      data({
        pool: [
          entry("ana", "liturgist", { servedThisTerm: 1 }),
          entry("budi", "liturgist"),
          entry("budi", "accommodation"),
        ],
      }),
      [row(schedule({}))]
    );
    // Budi would be the liturgist, but he's the only one for accommodation.
    expect(picked(result, "1", "accommodation")?.name).toBe("budi");
    expect(picked(result, "1", "leader")?.name).toBe("ana");
  });
});

describe("generatePlan: groups", () => {
  it("rotates cleaning every gathering and cooking at services, in the term's order", () => {
    const rows = planRows([], regularGatherings("2026-11", 1)).map((r) => r);
    const result = generate(
      data({
        lastGroups: { cleaning: "Group 2", cooking: "Group 5" },
        terms: [groupsTerm(6)],
      }),
      rows
    );
    // November 2026: Bible study, service, Bible study, service.
    expect(
      result.map((r) => [
        r.picks.find((p) => p.column === "cookingGroup")?.name ?? null,
        r.picks.find((p) => p.column === "cleaningGroup")?.name ?? null,
      ])
    ).toEqual([
      [null, "Group 3"],
      ["Group 6", "Group 4"],
      [null, "Group 5"],
      ["Group 1", "Group 6"],
    ]);
    expect(
      result[1]?.picks.find((p) => p.column === "cookingGroup")?.reason
    ).toBe("Next in the cooking rotation after Group 5.");
  });

  it("never lets one group cook and clean the same day", () => {
    const result = generate(
      data({
        lastGroups: { cleaning: "Group 1", cooking: "Group 1" },
        terms: [groupsTerm(3)],
      }),
      [row(schedule({}))]
    );
    const [only] = result;
    expect(only?.picks.find((p) => p.column === "cookingGroup")?.name).toBe(
      "Group 2"
    );
    const cleaning = only?.picks.find((p) => p.column === "cleaningGroup");
    expect(cleaning?.name).toBe("Group 3");
    expect(cleaning?.reason).toBe(
      "Next in the cleaning rotation after Group 1. Group 2 cooks that day."
    );
  });

  it("starts the rotation at the first group of a new term, in natural order", () => {
    const result = generate(
      data({
        lastGroups: { cleaning: "Old group", cooking: null },
        terms: [
          {
            groups: ["Group 10", "Group 2", "Group 1"].map((name) => ({
              members: [],
              name,
            })),
            startsOn: "2026-04-01",
          },
        ],
      }),
      [row(schedule({ type: "bible_study" }))]
    );
    expect(
      result[0]?.picks.find((p) => p.column === "cleaningGroup")
    ).toMatchObject({
      name: "Group 1",
      reason: "First in the cleaning rotation this term.",
    });
  });
});

describe("generatePlan: what it leaves alone", () => {
  it("never touches preachers, filled slots, published, cancelled or past gatherings", () => {
    const pool = [entry("ana", "musician"), entry("budi", "musician")];
    const draft = schedule({ id: 1, musician: "Someone", preacher: null });
    const published = schedule({
      date: on("2026-11-21"),
      id: 2,
      published: true,
    });
    const cancelled = schedule({
      cancelled: true,
      date: on("2026-11-28"),
      id: 3,
    });
    const past = schedule({ date: on("2026-10-17"), id: 4 });
    const result = generate(data({ pool }), [
      row(draft),
      row(published),
      row(cancelled),
      row(past),
    ]);
    expect(result.map((r) => r.row.key)).toEqual(["1"]);
    expect(picked(result, "1", "musician")).toBeUndefined();
    expect(picked(result, "1", "preacher")).toBeUndefined();
  });

  it("doesn't advance the rotation on a cancelled day", () => {
    const result = generate(
      data({
        lastGroups: { cleaning: "Group 1", cooking: null },
        terms: [groupsTerm(3)],
      }),
      [
        row(schedule({ cancelled: true, id: 1, type: "bible_study" })),
        row(schedule({ date: on("2026-11-21"), id: 2, type: "bible_study" })),
      ]
    );
    expect(picked(result, "2", "cleaningGroup")?.name).toBe("Group 2");
  });

  it("regenerate refills unlocked picks and keeps locked ones and manual picks", () => {
    const pool = [
      entry("ana", "musician"),
      entry("budi", "musician"),
      entry("citra", "note_writer"),
      entry("dewi", "leader"),
    ];
    const s = schedule({
      generated: {
        leader: {
          locked: true,
          reason: "Least recently served; not served yet.",
        },
        musician: { reason: "Least recently served; not served yet." },
      },
      id: 1,
      leader: "dewi",
      musician: "ana",
      noteWriter: "Manual Name",
      type: "bible_study",
    });
    const result = generate(
      data({
        before: [{ day: "2026-11-07", role: "musician", userId: "ana" }],
        pool,
      }),
      [row(s)],
      "regenerate"
    );
    const [only] = result;
    expect(only?.cleared).toEqual(["musician"]);
    expect(picked(result, "1", "musician")?.name).toBe("budi");
    expect(picked(result, "1", "leader")).toBeUndefined();
    expect(picked(result, "1", "noteWriter")).toBeUndefined();
    // Plain "fill" leaves the earlier pick where it is.
    expect(generate(data({ pool }), [row(s)])[0]?.cleared).toEqual([]);
  });

  it("is deterministic", () => {
    const rows = planRows([], regularGatherings("2026-11", 2));
    const d = data({
      pool: ["a", "b", "c", "d"].flatMap((id) => [
        entry(id, "musician"),
        entry(id, "note_writer"),
      ]),
    });
    expect(generate(d, rows)).toEqual(generate(d, rows));
  });
});

describe("generatePlan: a whole month", () => {
  it("fills every open slot of a month without breaking a rule the grid warns about", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const pool = ids.flatMap((id, index) => [
      entry(id, index % 2 === 0 ? "liturgist" : "leader", {
        scope: index % 2 === 0 ? "church_service" : "bible_study",
      }),
      entry(id, "musician"),
      entry(id, "note_writer"),
      entry(id, "multimedia", { scope: "church_service" }),
      entry(id, "accommodation", { scope: "church_service" }),
    ]);
    const d = data({
      lastGroups: { cleaning: "Group 6", cooking: "Group 3" },
      pool,
      terms: [
        groupsTerm(6, {
          "Group 1": ["a", "b"],
          "Group 2": ["c", "d"],
          "Group 3": ["e", "f"],
          "Group 4": ["g", "h"],
        }),
      ],
    });
    const rows = planRows([], regularGatherings("2026-11", 1));
    const result = generate(d, rows);
    expect(result.flatMap((r) => r.open)).toEqual([]);

    // Write the picks back and let the grid's own rules check every cell.
    const filled = result.map((r, index) => {
      const s: PlanSchedule = { ...r.row.schedule, id: index + 1 };
      for (const pick of r.picks) {
        s[pick.column] = pick.name;
      }
      return s;
    });
    const plan = buildPlan({ ...d, schedules: filled });
    for (const s of filled) {
      for (const column of PLAN_COLUMNS) {
        if (
          !hasColumn(column, s.type) ||
          columnRole(column, s.type) === "preacher"
        ) {
          continue;
        }
        expect(s[column], `${localDay(s.date)} ${column}`).toBeTruthy();
        expect(
          plan.cell(s, column).warnings,
          `${localDay(s.date)} ${column}`
        ).toEqual([]);
      }
    }
  });
});
