import { describe, expect, it } from "vitest";
import { POOL_SHEET_2026 } from "~/test/fixtures/serving-pool-sheet";
import {
  parsePoolSheet,
  planPoolImport,
  type SheetPoolEntry,
  type StoredPoolEntry,
  sheetPauseEnd,
} from "./serving-pool-sheet";

const { asOf, entries } = parsePoolSheet(POOL_SHEET_2026);
const find = (name: string, role: SheetPoolEntry["role"]) =>
  entries.find((entry) => entry.name === name && entry.role === role);

describe("parsePoolSheet", () => {
  it("reads the Stand date", () => {
    expect(asOf).toBe("2026-09-23");
  });

  it("makes a leader without a note lead both the service and PA Besar", () => {
    expect(
      entries
        .filter((entry) => entry.name === "Ana" && entry.role !== "musician")
        .map(({ role, scope }) => [role, scope])
    ).toEqual([
      ["leader", "bible_study"],
      ["liturgist", "church_service"],
    ]);
  });

  it("maps (PA besar) and (Ibadah) to one part or scope", () => {
    expect(find("Val", "leader")?.scope).toBe("bible_study");
    expect(find("Val", "liturgist")).toBeUndefined();
    expect(find("Eli", "liturgist")?.scope).toBe("church_service");
    expect(find("Eli", "leader")).toBeUndefined();
    expect(find("Mia", "musician")?.scope).toBe("church_service");
    expect(find("Lou", "musician")?.scope).toBe("church_service");
    expect(find("Fay", "musician")?.scope).toBe("bible_study");
    expect(find("Hal", "musician")?.scope).toBe("both");
    expect(find("Cia", "multimedia")?.scope).toBe("church_service");
  });

  it("maps (cadangan) to backup and pause words to paused, keeping the reason", () => {
    expect(find("Pia", "multimedia")).toMatchObject({
      note: null,
      paused: false,
      status: "backup",
    });
    expect(find("Ben", "musician")).toMatchObject({
      note: "stop dlu",
      paused: true,
      status: "active",
    });
    expect(find("Gus", "note_writer")).toMatchObject({
      note: "praktikum",
      paused: true,
    });
    expect(find("Pia", "leader")).toMatchObject({
      note: "pause",
      paused: true,
    });
  });

  it("reads every column down to its last name, skipping gaps", () => {
    expect(
      entries.filter((entry) => entry.role === "multimedia").map((e) => e.name)
    ).toEqual(["Cia", "Ben", "Dan", "Eli", "Pia", "Tia", "Ned", "Kim"]);
    expect(entries.filter((entry) => entry.role === "leader")).toHaveLength(12);
    expect(find("Wes", "musician")?.row).toBe(15);
  });

  it("keeps other notes as the note", () => {
    const [entry] = parsePoolSheet([
      ["Musiker", "Notes"],
      ["Xan (only evenings)", "ask first"],
    ]).entries;
    expect(entry).toMatchObject({
      name: "Xan",
      note: "only evenings · ask first",
      paused: false,
      scope: "both",
    });
  });
});

const stored = (
  overrides: Partial<StoredPoolEntry> & Pick<StoredPoolEntry, "userId">
): StoredPoolEntry => ({
  id: 1,
  pausedUntil: null,
  pauseNote: null,
  role: "musician",
  scope: "both",
  status: "active",
  ...overrides,
});

describe("planPoolImport", () => {
  const sheet = parsePoolSheet([
    ["Musiker", "Notes"],
    ["Ana"],
    ["Ben (cadangan)", "stop dlu"],
    ["Cia (Ibadah)"],
    ["Dee"],
    ["Ana"],
  ]).entries;
  const accounts: Record<string, string> = { Ana: "a", Ben: "b", Cia: "c" };
  const plan = (current: StoredPoolEntry[]) =>
    planPoolImport({
      accountFor: (name) => accounts[name],
      entries: sheet,
      pauseEnd: "2027-03-31",
      stored: current,
      today: "2026-10-25",
    });

  it("adds new people, lists unknown names and repeated lines", () => {
    const result = plan([]);
    expect(result.added.map((item) => item.userId)).toEqual(["a", "b", "c"]);
    expect(result.unmatched).toEqual([
      { name: "Dee", roles: ["musician"], rows: [5] },
    ]);
    expect(result.repeated.map((entry) => entry.row)).toEqual([6]);
  });

  it("lists changed fields, leaves matching entries alone and keeps missing ones", () => {
    const result = plan([
      stored({ id: 1, userId: "a" }),
      stored({ id: 2, userId: "b" }),
      stored({ id: 3, userId: "c" }),
      stored({ id: 4, role: "note_writer", userId: "a" }),
    ]);
    expect(result.unchanged).toBe(1);
    expect(result.changed.map(({ changes, id }) => [id, changes])).toEqual([
      [
        2,
        [
          { field: "status", from: "active", to: "backup" },
          { field: "pause", from: null, to: "2027-03-31" },
          { field: "note", from: null, to: "stop dlu" },
        ],
      ],
      [3, [{ field: "scope", from: "both", to: "church_service" }]],
    ]);
    expect(result.notInSheet.map((entry) => entry.id)).toEqual([4]);
  });

  it("never moves a running pause or ends one", () => {
    const result = plan([
      stored({
        id: 2,
        pausedUntil: "2026-12-01",
        pauseNote: "stop dlu",
        status: "backup",
        userId: "b",
      }),
      stored({ id: 1, pausedUntil: "2026-11-01", userId: "a" }),
    ]);
    expect(result.changed).toEqual([]);
    expect(result.unchanged).toBe(2);
  });
});

describe("sheetPauseEnd", () => {
  it("lasts until the next group term, or six months", () => {
    expect(
      sheetPauseEnd(
        [{ startsOn: "2026-04-01" }, { startsOn: "2027-04-01" }],
        "2026-10-25"
      )
    ).toBe("2027-03-31");
    expect(sheetPauseEnd([{ startsOn: "2026-04-01" }], "2026-10-25")).toBe(
      "2027-04-24"
    );
  });
});
