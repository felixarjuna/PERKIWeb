import { describe, expect, it } from "vitest";
import {
  DEFAULT_GROUP_NAMES,
  mayStartTermOn,
  nextTermStart,
  termStatus,
} from "./group-terms";

const april = { startsOn: "2026-04-01" };
const november = { startsOn: "2026-11-01" };
const terms = [{ startsOn: "2025-10-01" }, april, november];

describe("termStatus", () => {
  it("calls the term in force today current, earlier ones past, later upcoming", () => {
    const today = "2026-10-25";
    expect(terms.map((term) => termStatus(terms, term, today))).toEqual([
      "past",
      "current",
      "upcoming",
    ]);
  });

  it("switches on the start date", () => {
    expect(termStatus(terms, november, "2026-11-01")).toBe("current");
    expect(termStatus(terms, april, "2026-11-01")).toBe("past");
  });
});

describe("mayStartTermOn", () => {
  it("allows a later date that has no term yet", () => {
    expect(mayStartTermOn(terms, "2027-04-01", "2026-10-25")).toBeNull();
  });

  it("refuses today, the past and taken dates", () => {
    expect(mayStartTermOn(terms, "2026-10-25", "2026-10-25")).toContain(
      "after today"
    );
    expect(mayStartTermOn(terms, "2026-01-01", "2026-10-25")).toContain(
      "after today"
    );
    expect(mayStartTermOn(terms, "2026-11-01", "2026-10-25")).toContain(
      "already starts"
    );
  });
});

it("suggests the first day of next month", () => {
  expect(nextTermStart("2026-10-25")).toBe("2026-11-01");
  expect(nextTermStart("2026-12-01")).toBe("2027-01-01");
});

it("names the six groups as schedules write them", () => {
  expect(DEFAULT_GROUP_NAMES).toEqual([
    "Group 1",
    "Group 2",
    "Group 3",
    "Group 4",
    "Group 5",
    "Group 6",
  ]);
});
