import { describe, expect, it } from "vitest";
import {
  awayLookup,
  MAX_UNAVAILABLE_DAYS,
  rangeLabel,
  rangeProblem,
  unavailableOn,
} from "./unavailability";

const today = "2026-10-25";

describe("unavailableOn", () => {
  const ranges = [
    { endsOn: "2026-10-31", startsOn: "2026-10-31" },
    { endsOn: "2026-11-15", startsOn: "2026-11-10" },
  ];

  it("includes both ends of a range", () => {
    expect(unavailableOn(ranges, "2026-10-31")).toBe(true);
    expect(unavailableOn(ranges, "2026-11-10")).toBe(true);
    expect(unavailableOn(ranges, "2026-11-15")).toBe(true);
  });

  it("leaves the days around them free", () => {
    expect(unavailableOn(ranges, "2026-11-01")).toBe(false);
    expect(unavailableOn(ranges, "2026-11-16")).toBe(false);
    expect(unavailableOn([], "2026-10-31")).toBe(false);
  });
});

describe("rangeProblem", () => {
  it("accepts one day or a stretch from today on", () => {
    expect(rangeProblem({ endsOn: today, startsOn: today }, today)).toBeNull();
    expect(
      rangeProblem({ endsOn: "2026-11-08", startsOn: "2026-10-31" }, today)
    ).toBeNull();
  });

  it("refuses ranges that are backwards, over or too long", () => {
    expect(
      rangeProblem({ endsOn: "2026-10-30", startsOn: "2026-10-31" }, today)
    ).toBe("The last day comes before the first.");
    expect(
      rangeProblem({ endsOn: "2026-10-24", startsOn: "2026-10-20" }, today)
    ).toBe("Those days have already passed.");
    expect(
      rangeProblem({ endsOn: "2027-03-01", startsOn: "2026-11-01" }, today)
    ).toBe(
      `Mark at most ${MAX_UNAVAILABLE_DAYS} days at once. For longer, ask a mita to pause you.`
    );
    expect(
      rangeProblem({ endsOn: "2026-13-01", startsOn: "2026-11-01" }, today)
    ).toBe("Pick the days you can't serve.");
  });
});

describe("rangeLabel", () => {
  it("names one day or both ends", () => {
    expect(rangeLabel({ endsOn: "2026-10-31", startsOn: "2026-10-31" })).toBe(
      "Sat 31 Oct"
    );
    expect(rangeLabel({ endsOn: "2026-11-08", startsOn: "2026-10-31" })).toBe(
      "Sat 31 Oct – Sun 8 Nov"
    );
  });
});

describe("awayLookup", () => {
  const ana = { name: "Ana Putri", names: ["Ana Putri", "ana"], note: "Exams" };
  const away = awayLookup([ana]);

  it("matches every spelling, ignoring case and dots", () => {
    expect(away("Ana Putri")).toBe(ana);
    expect(away("ANA")).toBe(ana);
    expect(away("Ana.")).toBe(ana);
  });

  it("leaves other and empty names alone", () => {
    expect(away("Budi")).toBeUndefined();
    expect(away("")).toBeUndefined();
    expect(away(undefined)).toBeUndefined();
  });
});
