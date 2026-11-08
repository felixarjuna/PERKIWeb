import { describe, expect, it } from "vitest";
import {
  historyLine,
  lendHint,
  lendsByHand,
  type ShelfLending,
  shelfLabel,
  withdrawRefusal,
} from "./shelf-model";

const book = (overrides: Partial<ShelfLending>): ShelfLending => ({
  dueOn: null,
  holdEndsOn: null,
  holder: null,
  kind: "available",
  overdue: false,
  queue: 0,
  ...overrides,
});

describe("lending by hand", () => {
  it("lends a book on the shelf, or a held one to the member it's held for", () => {
    expect(lendsByHand("available")).toBe(true);
    expect(lendsByHand("reserved")).toBe(true);
    expect(lendsByHand("borrowed")).toBe(false);
    expect(lendsByHand("offered")).toBe(false);
    expect(lendsByHand("withdrawn")).toBe(false);
    expect(lendHint(book({}))).toBe(
      "For a member who can't tap Borrow themselves."
    );
    expect(lendHint(book({ holder: "Budi", kind: "reserved" }))).toBe(
      "It's held for Budi: lend it to them only."
    );
  });
});

describe("shelfLabel", () => {
  it("names the holder and due date for staff", () => {
    expect(shelfLabel(book({}))).toBe("");
    expect(shelfLabel(book({ queue: 1 }))).toBe("1 waiting");
    expect(
      shelfLabel(
        book({ dueOn: "2026-12-07", holder: "Ana", kind: "borrowed", queue: 2 })
      )
    ).toBe("Borrowed by Ana until 7 Dec · 2 waiting");
    expect(
      shelfLabel(
        book({
          dueOn: "2026-11-01",
          holder: "Ana",
          kind: "borrowed",
          overdue: true,
        })
      )
    ).toBe("Overdue since 2 Nov, borrowed by Ana");
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

  it("tells borrows, returns and extensions apart, with who and until when", () => {
    const line = (event: Partial<Parameters<typeof historyLine>[0]>) =>
      historyLine({
        actor: null,
        details: {},
        subject: null,
        type: "",
        ...event,
      });
    expect(
      line({
        actor: "Ana",
        details: { dueOn: "2026-12-07" },
        subject: "Ana",
        type: "borrowed",
      })
    ).toEqual({ detail: "by Ana · due 7 Dec", title: "Borrowed" });
    expect(
      line({
        actor: "Mita",
        details: { byHand: true, dueOn: "2026-12-07" },
        subject: "Ana",
        type: "borrowed",
      })
    ).toEqual({
      detail: "by Mita · to Ana · due 7 Dec",
      title: "Lent by hand",
    });
    expect(
      line({
        actor: "Ana",
        details: { dueOn: "2027-01-06", from: "2026-12-07" },
        subject: "Ana",
        type: "extended",
      })
    ).toEqual({ detail: "by Ana · until 6 Jan", title: "Loan extended" });
    expect(
      line({
        actor: "Mita",
        details: { dueOn: "2027-04-01", from: "2026-12-07", note: "Thesis" },
        subject: "Ana",
        type: "extended",
      })
    ).toEqual({
      detail: "by Mita · for Ana · until 1 Apr · “Thesis”",
      title: "Loan extended",
    });
    expect(line({ actor: "Mita", subject: "Ana", type: "returned" })).toEqual({
      detail: "by Mita · from Ana",
      title: "Returned",
    });
  });

  it("tells the queue's story: joins, holds, expiry, collection, offers", () => {
    const line = (event: Partial<Parameters<typeof historyLine>[0]>) =>
      historyLine({
        actor: null,
        details: {},
        subject: null,
        type: "",
        ...event,
      });
    expect(line({ actor: "Budi", subject: "Budi", type: "queued" })).toEqual({
      detail: "by Budi",
      title: "Joined the queue",
    });
    expect(
      line({ actor: "Budi", subject: "Budi", type: "left_queue" }).title
    ).toBe("Left the queue");
    expect(
      line({
        details: { expiresOn: "2026-11-14" },
        subject: "Budi",
        type: "ready",
      })
    ).toEqual({
      detail: "for Budi · until 14 Nov",
      title: "Reserved for the next in line",
    });
    expect(line({ subject: "Budi", type: "expired" })).toEqual({
      detail: "for Budi",
      title: "Hold ran out",
    });
    expect(line({ actor: "Budi", subject: "Budi", type: "fulfilled" })).toEqual(
      { detail: "by Budi", title: "Reservation collected" }
    );
    expect(line({ actor: "Mita", subject: "Budi", type: "cancelled" })).toEqual(
      {
        detail: "by Mita · for Budi",
        title: "Reservation cancelled",
      }
    );
    expect(line({ actor: "Citra", subject: "Citra", type: "offered" })).toEqual(
      {
        detail: "by Citra",
        title: "Offered to the library",
      }
    );
    expect(line({ actor: "Mita", subject: "Citra", type: "accepted" })).toEqual(
      {
        detail: "by Mita · lent by Citra",
        title: "Accepted on the shelf",
      }
    );
  });
});

describe("withdrawRefusal", () => {
  it("asks for the return before a borrowed book can leave", () => {
    expect(withdrawRefusal(book({ kind: "borrowed" }))).toBe(
      "Mark it returned before withdrawing it."
    );
    expect(withdrawRefusal(book({ kind: "available" }))).toBeNull();
    expect(withdrawRefusal(book({ kind: "reserved" }))).toBeNull();
  });
});
