import { describe, expect, it } from "vitest";
import {
  carriedOverSource,
  labelTaken,
  parseDocsSources,
  preselectedSource,
} from "./takeaway-sources";

const source = (id: string, label: string) => ({
  id,
  label,
  notesDocId: `${id}-notes`,
  tldrDocId: null,
});

describe("takeaway sources", () => {
  it("reads a stored list and treats anything else as none", () => {
    const stored = [source("a", "2025")];
    expect(parseDocsSources(JSON.stringify(stored))).toEqual(stored);
    expect(parseDocsSources(null)).toEqual([]);
    expect(parseDocsSources("not json")).toEqual([]);
    expect(parseDocsSources('[{"id":"a"}]')).toEqual([]);
  });

  it("carries the old pair over with the year in Aachen", () => {
    // 23:30 UTC on New Year's Eve is already the new year in Aachen.
    const now = new Date("2026-12-31T23:30:00Z");
    expect(
      carriedOverSource({ notesDocId: "notes", tldrDocId: "tldr" }, "x", now)
    ).toEqual({
      id: "x",
      label: "2027",
      notesDocId: "notes",
      tldrDocId: "tldr",
    });
    expect(
      carriedOverSource({ notesDocId: "notes" }, "x", now)?.tldrDocId
    ).toBeNull();
    expect(carriedOverSource({ tldrDocId: "tldr" }, "x", now)).toBeNull();
  });

  it("refuses a label another source uses, ignoring case and spaces", () => {
    const sources = [source("a", "2025"), source("b", "Youth")];
    expect(labelTaken(sources, " youth ")).toBe(true);
    expect(labelTaken(sources, "Youth", "b")).toBe(false);
    expect(labelTaken(sources, "2026")).toBe(false);
  });

  it("starts on the source used last, else the newest", () => {
    const sources = [source("a", "2025"), source("b", "2026")];
    expect(preselectedSource(sources, "a")).toBe("a");
    expect(preselectedSource(sources, "gone")).toBe("b");
    expect(preselectedSource(sources, null)).toBe("b");
    expect(preselectedSource([], null)).toBeNull();
  });
});
