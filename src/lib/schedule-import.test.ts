import { describe, expect, it } from "vitest";
import { planImport, type StoredSchedule } from "./schedule-import";
import type { SheetSchedule } from "./schedule-sheet";

const row: SheetSchedule = {
  accommodation: "",
  bibleVerse: "",
  cancelled: false,
  cleaningGroup: "Group 3",
  cookingGroup: "",
  date: new Date("2026-01-03T14:30:00.000Z"),
  day: "2026-01-03",
  description: "",
  flags: [],
  formerDescription: null,
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
  cancelled: false,
  cleaningGroup: "Group 3",
  cookingGroup: null,
  // Stored at 18:00 Aachen time by hand; still the same day.
  date: new Date("2026-01-03T17:00:00.000Z"),
  description: "",
  flags: [],
  id: 7,
  leader: "Ana",
  multimedia: null,
  musician: "Ben",
  noteWriter: "Cleo",
  preacher: null,
  type: "bible_study",
};

describe("planImport", () => {
  it("replaces a description an earlier import made from the internal notes", () => {
    const sheet = {
      ...row,
      description: "Perjamuan Kudus",
      formerDescription: "Perjamuan Kudus · Ana is away",
    };
    const [leaked] = planImport(
      [sheet],
      [{ ...stored, description: "Perjamuan Kudus · Ana is away" }]
    );
    expect(leaked).toMatchObject({
      changes: [
        {
          field: "description",
          from: "Perjamuan Kudus · Ana is away",
          to: "Perjamuan Kudus",
        },
      ],
      status: "changed",
    });

    // A description written on the site is left alone.
    const [kept] = planImport(
      [sheet],
      [{ ...stored, description: "Communion and fellowship" }]
    );
    expect(kept).toMatchObject({ changes: [], status: "unchanged" });
  });

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

  it("gives a schedule stored without a time the default start, but keeps a set time", () => {
    const midnight = { ...stored, date: new Date("2026-01-02T23:00:00.000Z") };
    expect(planImport([row], [midnight])[0]).toMatchObject({
      changes: [{ field: "time", from: "00:00", to: "15:30" }],
      status: "changed",
    });
    // `stored` is at 18:00, entered on the site.
    expect(planImport([row], [stored])[0]).toMatchObject({
      status: "unchanged",
    });
  });

  it("prefers the stored schedule of the same type on that day", () => {
    const service = { ...stored, id: 8, type: "church_service" };
    const [entry] = planImport([row], [service, stored]);
    expect(entry).toMatchObject({ id: 7, status: "unchanged" });
  });

  it("cancels a stored gathering without clearing its team", () => {
    const cancelled = {
      ...row,
      cancelled: true,
      cleaningGroup: "",
      leader: "",
      musician: "",
      noteWriter: "",
    };
    expect(planImport([cancelled], [stored])[0]).toMatchObject({
      changes: [{ field: "cancelled", from: "Planned", to: "Cancelled" }],
      status: "changed",
    });
    expect(
      planImport([cancelled], [{ ...stored, cancelled: true }])[0]
    ).toMatchObject({ changes: [], status: "unchanged" });
  });

  it("plans a gathering again when the sheet fills it", () => {
    expect(
      planImport([row], [{ ...stored, cancelled: true }])[0]
    ).toMatchObject({
      changes: [{ field: "cancelled", from: "Cancelled", to: "Planned" }],
      status: "changed",
    });
  });

  it("adds the sheet's flags and keeps flags set on the site", () => {
    const [entry] = planImport(
      [{ ...row, flags: ["communion"] }],
      [{ ...stored, flags: ["online"] }]
    );
    expect(entry).toMatchObject({
      changes: [
        { field: "flags", from: "Online", to: "Holy Communion, Online" },
      ],
      status: "changed",
    });
    expect(
      planImport([row], [{ ...stored, flags: ["online"] }])[0]
    ).toMatchObject({ status: "unchanged" });
  });
});
