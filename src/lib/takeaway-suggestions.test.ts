import { describe, expect, it } from "vitest";
import type { TakeawayStatus } from "./db/schema/schema";
import type { Role } from "./roles";
import {
  applySuggestion,
  mayDecideSuggestions,
  maySuggestOn,
} from "./takeaway-suggestions";

const AUTHOR = "author";

const viewer = (role: Role, id = "someone") => ({ id, role });
const takeaway = (
  status: TakeawayStatus,
  authorId: string | null = AUTHOR
) => ({ authorId, status });

describe("maySuggestOn", () => {
  it("lets other writers suggest only while it is in review", () => {
    const other = viewer("writer");
    expect(maySuggestOn(takeaway("draft"), other)).toBe(false);
    expect(maySuggestOn(takeaway("in_review"), other)).toBe(true);
    expect(maySuggestOn(takeaway("published"), other)).toBe(false);
  });

  it("never asks the writer to suggest edits to their own text", () => {
    for (const status of ["draft", "in_review", "published"] as const) {
      expect(maySuggestOn(takeaway(status), viewer("writer", AUTHOR))).toBe(
        false
      );
      expect(maySuggestOn(takeaway(status), viewer("mita", AUTHOR))).toBe(
        false
      );
    }
  });

  it("lets mita and the dev suggest until it is published", () => {
    for (const role of ["mita", "owner"] as const) {
      expect(maySuggestOn(takeaway("draft"), viewer(role))).toBe(true);
      expect(maySuggestOn(takeaway("in_review", null), viewer(role))).toBe(
        true
      );
      expect(maySuggestOn(takeaway("published"), viewer(role))).toBe(false);
    }
  });

  it("never lets members suggest", () => {
    expect(maySuggestOn(takeaway("in_review"), viewer("member"))).toBe(false);
  });
});

describe("mayDecideSuggestions", () => {
  it("lets the writer and staff decide until it is published", () => {
    const author = viewer("writer", AUTHOR);
    expect(mayDecideSuggestions(takeaway("draft"), author)).toBe(true);
    expect(mayDecideSuggestions(takeaway("in_review"), author)).toBe(true);
    expect(mayDecideSuggestions(takeaway("published"), author)).toBe(false);
    expect(mayDecideSuggestions(takeaway("in_review"), viewer("mita"))).toBe(
      true
    );
    expect(mayDecideSuggestions(takeaway("in_review"), viewer("owner"))).toBe(
      true
    );
    expect(mayDecideSuggestions(takeaway("published"), viewer("owner"))).toBe(
      false
    );
  });

  it("never lets other writers decide", () => {
    expect(mayDecideSuggestions(takeaway("in_review"), viewer("writer"))).toBe(
      false
    );
  });
});

describe("applySuggestion", () => {
  it("replaces a passage that appears exactly once", () => {
    expect(
      applySuggestion(
        "Abraham believed God, and it was counted.",
        "believed God",
        "trusted God"
      )
    ).toBe("Abraham trusted God, and it was counted.");
  });

  it("matches passages across a hard line break in notes saved with CRLF", () => {
    expect(
      applySuggestion("First line\r\nsecond line", "line\nsecond", "line, then")
    ).toBe("First line, then line");
  });

  it("returns null when the passage changed since", () => {
    expect(applySuggestion("Abraham trusted God", "believed God", "x")).toBe(
      null
    );
  });

  it("returns null when the passage is ambiguous", () => {
    expect(applySuggestion("God is God", "God", "Lord")).toBe(null);
  });

  it("inserts the replacement literally", () => {
    expect(applySuggestion("Cost: 5", "5", "$& and $1")).toBe(
      "Cost: $& and $1"
    );
  });
});
