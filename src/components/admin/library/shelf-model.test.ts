import { describe, expect, it } from "vitest";
import { historyLine, type ShelfLending, shelfLabel } from "./shelf-model";

const book = (overrides: Partial<ShelfLending>): ShelfLending => ({
  dueOn: null,
  holdEndsOn: null,
  holder: null,
  kind: "available",
  overdue: false,
  queue: 0,
  ...overrides,
});

describe("shelfLabel", () => {
  it("names the holder and due date for staff", () => {
    expect(shelfLabel(book({}))).toBe("");
    expect(shelfLabel(book({ queue: 1 }))).toBe("1 waiting");
    expect(
      shelfLabel(
        book({ dueOn: "2026-12-07", holder: "Ana", kind: "borrowed", queue: 2 })
      )
    ).toBe("Out with Ana until 7 Dec · 2 waiting");
    expect(
      shelfLabel(
        book({
          dueOn: "2026-11-01",
          holder: "Ana",
          kind: "borrowed",
          overdue: true,
        })
      )
    ).toBe("Overdue since 2 Nov, with Ana");
    expect(
      shelfLabel(
        book({ holdEndsOn: "2026-11-14", holder: "Budi", kind: "reserved" })
      )
    ).toBe("Held for Budi until 14 Nov");
    expect(shelfLabel(book({ kind: "withdrawn" }))).toBe("");
  });
});

describe("historyLine", () => {
  it("says who did what", () => {
    expect(
      historyLine({
        actor: "Mita",
        details: { author: "C. S. Lewis" },
        subject: "Budi",
        type: "added",
      })
    ).toEqual({
      detail: "by Mita · lent by Budi",
      title: "Added to the library",
    });
    expect(
      historyLine({
        actor: "Mita",
        details: { changed: ["title", "ownerId"] },
        subject: null,
        type: "edited",
      })
    ).toEqual({
      detail: "by Mita · changed title, owner",
      title: "Details edited",
    });
    expect(
      historyLine({
        actor: null,
        details: {},
        subject: null,
        type: "withdrawn",
      })
    ).toEqual({ detail: "", title: "Withdrawn" });
  });
});
