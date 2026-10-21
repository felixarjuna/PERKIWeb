import { describe, expect, it } from "vitest";
import { planImport, type StoredSchedule } from "./schedule-import";
import type { SheetSchedule } from "./schedule-sheet";

const row: SheetSchedule = {
  accommodation: "",
  bibleVerse: "",
  cleaningGroup: "Group 3",
  cookingGroup: "",
  date: new Date("2026-01-02T23:00:00.000Z"),
  day: "2026-01-03",
  description: "",
  leader: "Ana",
  multimedia: "",
  musician: "Ben",
  noteWriter: "Cleo",
  preacher: "",
  row: 2,
  title: "Penelaahan Alkitab",
  type: "bible_study",
};

const stored: StoredSchedule = {
  accommodation: null,
  bibleVerse: "Roma 1",
  cleaningGroup: "Group 3",
  cookingGroup: null,
  // Stored at 18:00 Aachen time by hand; still the same day.
  date: new Date("2026-01-03T17:00:00.000Z"),
  id: 7,
  leader: "Ana",
  multimedia: null,
  musician: "Ben",
  noteWriter: "Cleo",
  preacher: null,
  type: "bible_study",
};

describe("planImport", () => {
  it("marks a date with no stored schedule as new", () => {
    expect(planImport([row], [])).toEqual([{ schedule: row, status: "new" }]);
  });

  it("treats null and empty as equal and keeps a stored Bible verse when the sheet has none", () => {
    expect(planImport([row], [stored])).toEqual([
      { changes: [], id: 7, schedule: row, status: "unchanged" },
    ]);
  });

  it("lists every changed slot", () => {
    const [entry] = planImport(
      [{ ...row, musician: "Dan", noteWriter: "" }],
      [stored]
    );
    expect(entry).toMatchObject({
      changes: [
        { field: "musician", from: "Ben", to: "Dan" },
        { field: "noteWriter", from: "Cleo", to: "" },
      ],
      status: "changed",
    });
  });

  it("prefers the stored schedule of the same type on that day", () => {
    const service = { ...stored, id: 8, type: "church_service" };
    const [entry] = planImport([row], [service, stored]);
    expect(entry).toMatchObject({ id: 7, status: "unchanged" });
  });
});
