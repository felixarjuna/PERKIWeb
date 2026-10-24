import { describe, expect, it } from "vitest";
import {
  contributorNames,
  fellowshipLabel,
  publicationDates,
  serviceDate,
} from "./takeaway-format";

describe("contributorNames", () => {
  it("joins names as a sentence", () => {
    expect(contributorNames(["Gaby"])).toBe("Gaby");
    expect(contributorNames(["Gaby", "Erico"])).toBe("Gaby and Erico");
    expect(contributorNames(["Gaby", "Erico", "Tius"])).toBe(
      "Gaby, Erico, and Tius"
    );
  });

  it("drops blanks and non-strings, and returns null for nobody", () => {
    expect(contributorNames([" Gaby ", "", 3, null])).toBe("Gaby");
    expect(contributorNames([])).toBeNull();
    expect(contributorNames(null)).toBeNull();
    expect(contributorNames("Gaby")).toBeNull();
  });
});

describe("serviceDate", () => {
  // 23:30 UTC on 15 Oct is already 16 Oct in Aachen.
  const lateEvening = new Date("2026-10-15T23:30:00Z");

  it("reads the date in Aachen time", () => {
    expect(serviceDate(lateEvening)).toBe("16 Oct 2026");
    expect(serviceDate(lateEvening, "long")).toBe("Friday, 16 October 2026");
  });
});

describe("fellowshipLabel", () => {
  it("names both fellowship types", () => {
    expect(fellowshipLabel("bible_study")).toBe("Bible study");
    expect(fellowshipLabel("church_service")).toBe("Church service");
  });
});

describe("publicationDates", () => {
  const published = new Date("2026-03-02T09:00:00Z");

  it("shows when it was published, and when it was updated on a later day", () => {
    expect(
      publicationDates(published, new Date("2026-03-09T18:30:00Z"))
    ).toEqual([
      { date: published, label: "Published", text: "2 Mar 2026" },
      {
        date: new Date("2026-03-09T18:30:00Z"),
        label: "Updated",
        text: "9 Mar 2026",
      },
    ]);
  });

  it("leaves out an update on the day it was published (in Aachen)", () => {
    expect(
      publicationDates(published, new Date("2026-03-02T22:30:00Z"))
    ).toEqual([{ date: published, label: "Published", text: "2 Mar 2026" }]);
    expect(publicationDates(published, null)).toHaveLength(1);
  });

  it("shows only the update for takeaways published before dates were kept", () => {
    expect(publicationDates(null, null)).toEqual([]);
    expect(
      publicationDates(null, new Date("2026-03-09T12:00:00Z"))
    ).toMatchObject([{ label: "Updated", text: "9 Mar 2026" }]);
  });
});
