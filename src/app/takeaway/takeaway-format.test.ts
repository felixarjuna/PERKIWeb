import { describe, expect, it } from "vitest";
import {
  contributorNames,
  fellowshipLabel,
  preview,
  readingMinutes,
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

describe("preview", () => {
  it("is the plain text, without blank lines or Markdown syntax", () => {
    expect(preview("One.\n\nTwo.\nThree.")).toBe("One.\nTwo.\nThree.");
    expect(preview("## Judul\n\n- **Satu**\n- Dua")).toBe("Judul\nSatu\nDua");
  });
});

describe("readingMinutes", () => {
  const words = (count: number) => new Array(count).fill("kata").join(" ");

  it("estimates at 200 words a minute, at least one minute", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes(words(50))).toBe(1);
    expect(readingMinutes(words(1000))).toBe(5);
    expect(readingMinutes(`${words(700)}\n\n${words(500)}`)).toBe(6);
  });

  it("doesn't count Markdown syntax as words", () => {
    // 300 one-word list items: 300 words, not 600 with the "-" markers.
    expect(readingMinutes("- kata\n".repeat(300))).toBe(2);
  });
});

describe("fellowshipLabel", () => {
  it("names both fellowship types", () => {
    expect(fellowshipLabel("bible_study")).toBe("Bible study");
    expect(fellowshipLabel("church_service")).toBe("Church service");
  });
});
