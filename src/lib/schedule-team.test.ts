import { describe, expect, it } from "vitest";
import {
  localDay,
  onPickedDay,
  openSlots,
  slotsFromSchedule,
  startOn,
  termOn,
  weekOf,
} from "./schedule-team";

describe("slotsFromSchedule", () => {
  it("reads the leader column as liturgist at a service and leader at a Bible study", () => {
    expect(
      slotsFromSchedule({ leader: "Ana", type: "church_service" })
    ).toEqual([{ name: "Ana", role: "liturgist" }]);
    expect(slotsFromSchedule({ leader: "Ana", type: "bible_study" })).toEqual([
      { name: "Ana", role: "leader" },
    ]);
  });

  it("skips empty slots and trims names", () => {
    expect(
      slotsFromSchedule({
        accommodation: " - ",
        musician: "  Ben ",
        noteWriter: "",
        preacher: null,
        type: "church_service",
      })
    ).toEqual([{ name: "Ben", role: "musician" }]);
  });
});

describe("localDay", () => {
  it("uses the calendar day in Aachen", () => {
    expect(localDay(new Date("2026-03-31T22:30:00Z"))).toBe("2026-04-01");
  });
});

describe("termOn", () => {
  const terms = [{ startsOn: "2026-04-01" }, { startsOn: "2025-10-01" }];

  it("picks the latest term that started on or before the day", () => {
    expect(termOn(terms, "2026-04-01")).toEqual({ startsOn: "2026-04-01" });
    expect(termOn(terms, "2026-03-31")).toEqual({ startsOn: "2025-10-01" });
  });

  it("returns undefined before the first term", () => {
    expect(termOn(terms, "2025-01-01")).toBeUndefined();
  });
});

describe("onPickedDay", () => {
  // A calendar hands back the browser's local midnight of the picked day.
  const picked = new Date(2026, 5, 13);

  it("uses 15:30 in Aachen for a new schedule", () => {
    expect(onPickedDay(picked)).toEqual(new Date("2026-06-13T13:30:00.000Z"));
  });

  it("keeps the time of a schedule that has one", () => {
    expect(onPickedDay(picked, new Date("2026-05-01T16:00:00.000Z"))).toEqual(
      new Date("2026-06-13T16:00:00.000Z")
    );
  });

  it("treats a stored midnight as no time", () => {
    expect(onPickedDay(picked, new Date("2026-04-30T22:00:00.000Z"))).toEqual(
      new Date("2026-06-13T13:30:00.000Z")
    );
  });
});

describe("openSlots", () => {
  it("lists the empty slots a service needs, in team order", () => {
    expect(
      openSlots({
        accommodation: "-",
        cleaningGroup: "Group 2",
        cookingGroup: null,
        leader: "Ana",
        multimedia: " ",
        musician: "Ben",
        noteWriter: "Cleo",
        preacher: "Pdt. John Kusuma",
        type: "church_service",
      })
    ).toEqual(["Multimedia", "Accommodation", "Cooking group"]);
  });

  it("asks a Bible study only for its own slots", () => {
    expect(
      openSlots({
        cleaningGroup: "",
        leader: "Ana",
        musician: "Ben",
        noteWriter: "",
        type: "bible_study",
      })
    ).toEqual(["Note writer", "Cleaning group"]);
  });
});

describe("weekOf", () => {
  // Thursday 22 October 2026, 10:00 in Aachen.
  const thursday = new Date("2026-10-22T08:00:00Z");

  it("spans Sunday to Saturday in Aachen as whole days", () => {
    expect(weekOf(thursday)).toEqual({
      before: new Date("2026-10-24T22:00:00Z"),
      from: new Date("2026-10-17T22:00:00Z"),
    });
  });

  it("includes Saturday's gathering before it starts", () => {
    const { before, from } = weekOf(thursday);
    const saturday = startOn({ day: 24, month: 10, year: 2026 });
    expect(saturday >= from && saturday < before).toBe(true);
  });

  it("starts a new week on Sunday in Aachen", () => {
    // Sunday 25 October 2026, 01:30 in Aachen, the night the clocks go back.
    expect(weekOf(new Date("2026-10-24T23:30:00Z")).from).toEqual(
      new Date("2026-10-24T22:00:00Z")
    );
  });
});
