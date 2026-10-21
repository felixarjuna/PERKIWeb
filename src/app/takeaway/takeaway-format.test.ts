import { describe, expect, it } from "vitest";
import {
  contributorNames,
  fellowshipLabel,
  paragraphs,
  preview,
  sections,
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

  it("splits off a writer's section title", () => {
    expect(
      sections(
        "Intro sentence.\n\n1. Integritas Nuh\nDi Kejadian 8:20 kita bisa melihat.\nLine two."
      )
    ).toEqual([
      { body: "Intro sentence.", heading: null },
      {
        body: "Di Kejadian 8:20 kita bisa melihat.\nLine two.",
        heading: "1. Integritas Nuh",
      },
    ]);
  });

  it("keeps prose line breaks and lone short lines as body text", () => {
    const prose = "Allah pun senang akan persembahan Nuh,\nIa melihat korban.";
    const verse = "ay.14: Paulus mencoba\nmenjelaskan";
    const wrapped = "Ia melihat korban bakaran tersebut sebagai\npersembahan.";
    expect(sections(prose)).toEqual([{ body: prose, heading: null }]);
    expect(sections("Prayer point")).toEqual([
      { body: "Prayer point", heading: null },
    ]);
    expect(sections(verse)[0]?.heading).toBeNull();
    expect(sections(wrapped)[0]?.heading).toBeNull();
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
