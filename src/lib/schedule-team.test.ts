import { describe, expect, it } from "vitest";
import {
  isCancelled,
  localDay,
  onPickedDay,
  openSlots,
  sameDayWarning,
  slotColumn,
  slotsFromSchedule,
  startOn,
  type TakeCheck,
  takeRefusal,
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

const check = (overrides: Partial<TakeCheck> = {}): TakeCheck => ({
  cancelled: false,
  cooksThatDay: false,
  day: "2026-11-07",
  entry: { pausedUntil: null, scope: "both", status: "active" },
  holder: null,
  mine: false,
  role: "musician",
  today: "2026-10-25",
  type: "bible_study",
  ...overrides,
});

describe("slotColumn", () => {
  it("maps each role to the schedule column it fills on that kind of gathering", () => {
    expect(slotColumn("liturgist", "church_service")).toBe("leader");
    expect(slotColumn("leader", "bible_study")).toBe("leader");
    expect(slotColumn("musician", "bible_study")).toBe("musician");
    expect(slotColumn("note_writer", "church_service")).toBe("noteWriter");
    expect(slotColumn("multimedia", "church_service")).toBe("multimedia");
  });

  it("has no slot for roles a gathering doesn't schedule", () => {
    expect(slotColumn("liturgist", "bible_study")).toBeNull();
    expect(slotColumn("leader", "church_service")).toBeNull();
    expect(slotColumn("accommodation", "bible_study")).toBeNull();
    expect(slotColumn("publication", "church_service")).toBeNull();
  });
});

describe("takeRefusal", () => {
  it("lets an active member take an open slot in their role and scope", () => {
    expect(takeRefusal(check())).toBeNull();
    expect(
      takeRefusal(
        check({
          entry: { pausedUntil: null, scope: "bible_study", status: "active" },
        })
      )
    ).toBeNull();
  });

  it("refuses a slot that's taken, by someone else or by the member", () => {
    expect(takeRefusal(check({ holder: "Ana" }))).toBe(
      "Ana has already taken this slot."
    );
    expect(takeRefusal(check({ holder: "Ana", mine: true }))).toBe(
      "You're already in this slot."
    );
  });

  it("refuses members who aren't active in that role", () => {
    expect(takeRefusal(check({ entry: undefined }))).toBe(
      "You're not in the serving pool as musician. Ask a mita to add you."
    );
    expect(
      takeRefusal(
        check({ entry: { pausedUntil: null, scope: "both", status: "backup" } })
      )
    ).toBe("You're a backup musician, so a mita fills this slot for you.");
  });

  it("refuses a gathering outside the member's scope", () => {
    expect(
      takeRefusal(
        check({
          entry: {
            pausedUntil: null,
            scope: "church_service",
            status: "active",
          },
        })
      )
    ).toBe("You serve as musician at services only.");
  });

  it("refuses while the member is paused on that day, not after", () => {
    const paused = (pausedUntil: string) =>
      check({ entry: { pausedUntil, scope: "both", status: "active" } });
    expect(takeRefusal(paused("2026-11-07"))).toBe(
      "You're paused until 7 Nov, so you can't take this slot."
    );
    expect(takeRefusal(paused("2026-11-06"))).toBeNull();
  });

  it("refuses liturgist and musician when the member's group cooks that day", () => {
    expect(takeRefusal(check({ cooksThatDay: true }))).toBe(
      "Your group cooks that day, so you can't serve as musician too."
    );
    expect(
      takeRefusal(
        check({
          cooksThatDay: true,
          role: "liturgist",
          type: "church_service",
        })
      )
    ).toBe("Your group cooks that day, so you can't serve as liturgist too.");
    expect(
      takeRefusal(check({ cooksThatDay: true, role: "note_writer" }))
    ).toBeNull();
  });

  it("refuses past and cancelled gatherings and roles the gathering doesn't have", () => {
    expect(takeRefusal(check({ day: "2026-10-24" }))).toBe(
      "This gathering has already happened."
    );
    expect(takeRefusal(check({ cancelled: true }))).toBe(
      "This gathering is cancelled."
    );
    expect(takeRefusal(check({ role: "liturgist" }))).toBe(
      "A Bible study has no liturgist slot."
    );
  });
});

describe("sameDayWarning", () => {
  it("warns about a second slot on the same day, without refusing it", () => {
    expect(sameDayWarning([])).toBeNull();
    expect(sameDayWarning(["note_writer"])).toBe(
      "You already serve as note writer that day."
    );
    expect(sameDayWarning(["leader", "note_writer"])).toBe(
      "You already serve as leader and note writer that day."
    );
  });
});

describe("isCancelled", () => {
  it("reads a cancelled flag once schedules have one", () => {
    expect(isCancelled({})).toBe(false);
    expect(isCancelled({ cancelled: false })).toBe(false);
    expect(isCancelled({ cancelled: true })).toBe(true);
  });
});
