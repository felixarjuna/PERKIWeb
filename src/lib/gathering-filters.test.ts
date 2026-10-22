import { describe, expect, it } from "vitest";
import {
  filterQuery,
  filtersFrom,
  isFiltered,
  NO_FILTERS,
} from "./gathering-filters";
import { isMonth, monthLabel, monthRange, monthsOf } from "./months";

describe("months", () => {
  it("covers a month in Aachen time", () => {
    expect(monthRange("2026-10")).toEqual({
      // CEST until 25 Oct, CET from then on.
      before: new Date("2026-10-31T23:00:00Z"),
      from: new Date("2026-09-30T22:00:00Z"),
    });
  });

  it("lists distinct months newest first, by Aachen's calendar", () => {
    expect(
      monthsOf([
        new Date("2026-03-07T14:30:00Z"),
        new Date("2026-10-31T23:30:00Z"), // already 1 November in Aachen
        new Date("2026-03-21T14:30:00Z"),
      ])
    ).toEqual(["2026-11", "2026-03"]);
  });

  it("labels and validates month keys", () => {
    expect(monthLabel("2026-10")).toBe("October 2026");
    expect(isMonth("2026-10")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
    expect(isMonth("October")).toBe(false);
  });
});

describe("gathering filters", () => {
  it("reads the URL and ignores values that don't fit", () => {
    expect(
      filtersFrom(new URLSearchParams("q=nuh&type=bible_study&month=2026-10"))
    ).toEqual({ month: "2026-10", q: "nuh", type: "bible_study" });
    expect(filtersFrom(new URLSearchParams("type=concert&month=soon"))).toEqual(
      NO_FILTERS
    );
  });

  it("knows when anything narrows the list", () => {
    expect(isFiltered(NO_FILTERS)).toBe(false);
    expect(isFiltered({ ...NO_FILTERS, q: "  " })).toBe(false);
    expect(isFiltered({ ...NO_FILTERS, month: "2026-10" })).toBe(true);
  });

  it("turns a month into the window the server filters by", () => {
    expect(
      filterQuery({ month: "2026-10", q: " grace ", type: "all" })
    ).toEqual({
      before: new Date("2026-10-31T23:00:00Z"),
      from: new Date("2026-09-30T22:00:00Z"),
      q: "grace",
      type: "all",
    });
    expect(filterQuery(NO_FILTERS)).toEqual({ q: "", type: "all" });
  });
});
