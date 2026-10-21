import { describe, expect, it } from "vitest";
import { SHEET_2026 } from "~/test/fixtures/schedule-sheet";
import { parseScheduleSheet } from "./schedule-sheet";

describe("parseScheduleSheet", () => {
  const { schedules, skipped } = parseScheduleSheet(SHEET_2026);

  it("reads services and Bible studies by header, at 15:30 in Aachen", () => {
    expect(schedules).toEqual([
      expect.objectContaining({
        bibleVerse: "",
        cleaningGroup: "Group 3",
        cookingGroup: "",
        date: new Date("2026-01-03T14:30:00.000Z"),
        day: "2026-01-03",
        leader: "Ana",
        musician: "Ben",
        noteWriter: "Cleo",
        preacher: "",
        title: "Penelaahan Alkitab",
        type: "bible_study",
      }),
      expect.objectContaining({
        accommodation: "Gus",
        bibleVerse: "Habakuk 2",
        cookingGroup: "Group 1",
        description: "Perjamuan Kudus",
        leader: "Dan",
        multimedia: "Finn",
        preacher: "Pdt. Guest",
        type: "church_service",
      }),
    ]);
  });

  it("skips special events and empty dates, and ignores the group list", () => {
    expect(skipped).toEqual([
      expect.objectContaining({ day: "2026-04-04", row: 6 }),
      {
        day: "2026-12-31",
        reason: "Nothing is planned on this date.",
        row: 7,
      },
    ]);
    expect(skipped[0]?.reason).toContain("Bible Camp Pemuridan");
  });

  it("uses the 2025 layout's title, description and Bible verse columns", () => {
    const { schedules: rows } = parseScheduleSheet([
      [
        "Tanggal",
        "Acara",
        "Leader",
        " Musik",
        "Catatan",
        "Piket",
        "Special Notes",
        "Event Title",
        "Event Description",
        "Bible verse",
      ],
      [
        "4.1.2025",
        "Penelaahan Alkitab",
        "Ana",
        "Ben",
        "Cleo",
        "Group 3",
        "Putzdienst",
        "Heroes of Faith",
        "Noah",
        "Kejadian 6",
      ],
    ]);
    expect(rows[0]).toMatchObject({
      bibleVerse: "Kejadian 6",
      description: "Noah",
      formerDescription: null,
      title: "Heroes of Faith",
    });
  });

  it("keeps the internal special notes out of the description", () => {
    const { schedules: rows } = parseScheduleSheet([
      ["Tanggal", "Acara", "Leader", "Piket", "Events", "Special Notes"],
      ["3.1.2026", "Penelaahan Alkitab", "Ana", "Group 3", "", "Ben is away"],
      [
        "10.1.2026",
        "Penelaahan Alkitab",
        "Ana",
        "Group 3",
        "Retreat",
        "Bring food",
      ],
    ]);
    expect(rows).toMatchObject([
      { description: "", formerDescription: "Ben is away" },
      { description: "Retreat", formerDescription: "Retreat · Bring food" },
    ]);
  });

  it("keeps columns a shorter repeated header leaves out", () => {
    const { schedules: rows } = parseScheduleSheet([
      [
        "Tanggal",
        "Acara",
        "Leader",
        " Musik",
        "Catatan",
        "Piket",
        "Tema Kotbah",
      ],
      ["Tanggal", "Acara", "Leader", " Musik", "Catatan", "Piket"],
      [
        "16.5.2026",
        "Penelaahan Alkitab",
        "Ana",
        "Ben",
        "Cleo",
        "Group 2",
        "1 Yohanes 1:5-10",
      ],
    ]);
    expect(rows[0]?.bibleVerse).toBe("1 Yohanes 1:5-10");
  });

  it("ignores rows before the first header", () => {
    expect(
      parseScheduleSheet([["3.1.2026", "Kebaktian", "x"]]).schedules
    ).toEqual([]);
  });
});
