import { describe, expect, it } from "vitest";
import { SHEET_2026 } from "~/test/fixtures/schedule-sheet";
import { parseScheduleSheet } from "./schedule-sheet";

describe("parseScheduleSheet", () => {
  const { schedules, skipped } = parseScheduleSheet(SHEET_2026);

  it("reads services and Bible studies by header, at midnight in Aachen", () => {
    expect(schedules).toEqual([
      expect.objectContaining({
        bibleVerse: "",
        cleaningGroup: "Group 3",
        cookingGroup: "",
        date: new Date("2026-01-02T23:00:00.000Z"),
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
      title: "Heroes of Faith",
    });
  });

  it("ignores rows before the first header", () => {
    expect(
      parseScheduleSheet([["3.1.2026", "Kebaktian", "x"]]).schedules
    ).toEqual([]);
  });
});
