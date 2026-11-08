import { describe, expect, it } from "vitest";
import { booksSummary } from "./books-card";

const TODAY = "2026-11-07";

describe("booksSummary", () => {
  it("names the one book or counts several, soonest due first", () => {
    expect(booksSummary([], TODAY)).toBe("No library books with you right now");
    expect(
      booksSummary([{ dueOn: "2026-12-07", title: "Mere Christianity" }], TODAY)
    ).toBe("Mere Christianity, due 7 Dec");
    expect(
      booksSummary(
        [
          { dueOn: "2026-12-07", title: "Mere Christianity" },
          { dueOn: "2026-12-20", title: "Miracles" },
        ],
        TODAY
      )
    ).toBe("2 books, next due 7 Dec");
  });

  it("says when something is overdue", () => {
    expect(
      booksSummary([{ dueOn: "2026-11-01", title: "Miracles" }], TODAY)
    ).toBe("Miracles is overdue");
    expect(
      booksSummary(
        [
          { dueOn: "2026-11-01", title: "Miracles" },
          { dueOn: "2026-12-07", title: "Mere Christianity" },
        ],
        TODAY
      )
    ).toBe("1 of 2 books overdue");
  });
});
