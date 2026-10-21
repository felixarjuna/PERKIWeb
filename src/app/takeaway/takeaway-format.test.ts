import { describe, expect, it } from "vitest";
import {
  contributorNames,
  fellowshipLabel,
  paragraphs,
  preview,
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

describe("paragraphs", () => {
  it("splits at blank lines and keeps single line breaks", () => {
    expect(paragraphs("1. One\n2. Two\n\n  \nPrayer point\n")).toEqual([
      "1. One\n2. Two",
      "Prayer point",
    ]);
  });

  it("joins paragraphs without blank lines for the list preview", () => {
    expect(preview("One.\n\nTwo.\nThree.")).toBe("One.\nTwo.\nThree.");
  });
});

describe("fellowshipLabel", () => {
  it("names both fellowship types", () => {
    expect(fellowshipLabel("bible_study")).toBe("Bible study");
    expect(fellowshipLabel("church_service")).toBe("Church service");
  });
});
