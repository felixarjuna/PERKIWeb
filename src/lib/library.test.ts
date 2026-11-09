import { describe, expect, it } from "vitest";
import {
  addDays,
  bookState,
  borrowRefusal,
  dueLabel,
  dueOnFrom,
  extendedDueOn,
  extendRefusal,
  extensionsLeftLabel,
  HOLD_DAYS,
  holdEndsOn,
  inLineLabel,
  inShelfState,
  isDay,
  joinRefusal,
  LIBRARY_LANGUAGES,
  LOAN_DAYS,
  languageLabel,
  lentLabel,
  libraryFiltersFrom,
  MAX_EXTENSIONS,
  type MemberBookState,
  memberBookState,
  placeInLine,
  queuePosition,
  type ReservationLine,
  settleQueue,
  shownFor,
  sortBooks,
  stateLabel,
} from "./library";

const TODAY = "2026-11-07";
const shelf = { status: "available" as const };

const reservation = (
  id: number,
  userId: string,
  overrides: Partial<ReservationLine> = {}
): ReservationLine => ({
  createdAt: new Date(`2026-10-0${id}T10:00:00Z`),
  expiresOn: null,
  id,
  status: "waiting",
  userId,
  ...overrides,
});

describe("library rules", () => {
  it("lends for 30 days, twice extendable, and holds for 7", () => {
    expect([LOAN_DAYS, MAX_EXTENSIONS, HOLD_DAYS]).toEqual([30, 2, 7]);
    expect(dueOnFrom(TODAY)).toBe("2026-12-07");
    expect(holdEndsOn(TODAY)).toBe("2026-11-14");
    // Aachen calendar days, across the end of summer time.
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
  });
});

describe("bookState", () => {
  it("keeps offered and withdrawn books out of lending", () => {
    expect(bookState({ status: "offered" }, null, [], TODAY)).toEqual({
      kind: "offered",
    });
    expect(
      bookState(
        { status: "withdrawn" },
        { dueOn: TODAY, userId: "ana" },
        [],
        TODAY
      )
    ).toEqual({ kind: "withdrawn" });
  });

  it("is available on the shelf, whatever the cached status says", () => {
    expect(bookState({ status: "borrowed" }, null, [], TODAY)).toEqual({
      kind: "available",
      queue: 0,
    });
  });

  it("is borrowed while a loan is open, overdue after the due day", () => {
    const loan = { dueOn: "2026-11-06", userId: "ana" };
    expect(
      bookState(shelf, loan, [reservation(1, "budi")], "2026-11-06")
    ).toEqual({
      dueOn: "2026-11-06",
      holderId: "ana",
      kind: "borrowed",
      overdue: false,
      queue: 1,
    });
    expect(bookState(shelf, loan, [], TODAY)).toMatchObject({ overdue: true });
  });

  it("is reserved for the first in line until their hold runs out", () => {
    const line = [
      reservation(2, "citra"),
      reservation(1, "budi", { expiresOn: "2026-11-10", status: "ready" }),
      reservation(3, "dewi", { status: "cancelled" }),
    ];
    expect(bookState(shelf, null, line, "2026-11-10")).toEqual({
      holdEndsOn: "2026-11-10",
      kind: "reserved",
      queue: 1,
      reservedFor: "budi",
    });
    // Budi's hold ran out on the 10th: Citra's 7 days start when it passes.
    expect(bookState(shelf, null, line, "2026-11-12")).toEqual({
      holdEndsOn: "2026-11-19",
      kind: "reserved",
      queue: 0,
      reservedFor: "citra",
    });
  });

  it("is available once the last hold runs out", () => {
    const line = [
      reservation(1, "budi", { expiresOn: "2026-11-10", status: "ready" }),
    ];
    expect(bookState(shelf, null, line, "2026-11-11")).toEqual({
      kind: "available",
      queue: 0,
    });
  });

  it("holds a returned book for the first in line from the day it's back", () => {
    expect(bookState(shelf, null, [reservation(1, "budi")], TODAY)).toEqual({
      holdEndsOn: "2026-11-14",
      kind: "reserved",
      queue: 0,
      reservedFor: "budi",
    });
  });
});

describe("settleQueue", () => {
  it("leaves a running hold and a borrowed book alone", () => {
    const ready = reservation(1, "budi", {
      expiresOn: "2026-11-10",
      status: "ready",
    });
    expect(settleQueue([ready, reservation(2, "citra")], "2026-11-10")).toEqual(
      { expire: [], ready: null }
    );
    expect(settleQueue([], TODAY)).toEqual({ expire: [], ready: null });
  });

  it("gives a returned book to the first in line for 7 days", () => {
    expect(
      settleQueue([reservation(2, "citra"), reservation(1, "budi")], TODAY)
    ).toEqual({
      expire: [],
      ready: { expiresOn: "2026-11-14", id: 1, userId: "budi" },
    });
  });

  it("expires a run-out hold and passes the book to the next in line", () => {
    const line = [
      reservation(1, "budi", { expiresOn: "2026-11-05", status: "ready" }),
      reservation(2, "citra"),
    ];
    expect(settleQueue(line, TODAY)).toEqual({
      expire: [1],
      ready: { expiresOn: "2026-11-14", id: 2, userId: "citra" },
    });
    expect(settleQueue(line.slice(0, 1), TODAY)).toEqual({
      expire: [1],
      ready: null,
    });
  });
});

describe("the queue", () => {
  const borrowed = bookState(
    shelf,
    { dueOn: "2026-12-07", userId: "ana" },
    [],
    TODAY
  );

  it("counts places among those still waiting", () => {
    const line = [
      reservation(3, "dewi"),
      reservation(1, "budi", { expiresOn: "2026-11-10", status: "ready" }),
      reservation(2, "citra"),
    ];
    expect(queuePosition(line, "citra")).toBe(1);
    expect(queuePosition(line, "dewi")).toBe(2);
    expect(queuePosition(line, "budi")).toBeNull();
    expect(queuePosition(line, "eka")).toBeNull();
  });

  it("reads a place from the derived state, before the queue is written", () => {
    const line = [
      reservation(1, "budi", { expiresOn: "2026-11-05", status: "ready" }),
      reservation(2, "citra"),
      reservation(3, "dewi"),
    ];
    // Budi's hold ran out unwritten: it's Citra's turn, Dewi is next.
    const state = bookState(shelf, null, line, TODAY);
    expect(placeInLine(state, line, "citra")).toEqual({
      holdEndsOn: "2026-11-14",
      position: null,
    });
    expect(placeInLine(state, line, "dewi")).toEqual({
      holdEndsOn: null,
      position: 1,
    });
    expect(placeInLine(state, line, "budi")).toEqual({
      holdEndsOn: null,
      position: null,
    });
  });

  it("says the place in line", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map(inLineLabel)).toEqual([
      "1st in line",
      "2nd in line",
      "3rd in line",
      "4th in line",
      "11th in line",
      "12th in line",
      "13th in line",
      "21st in line",
      "22nd in line",
    ]);
  });

  it("lets members join only a book someone else has", () => {
    expect(joinRefusal(borrowed, "budi", false)).toBeNull();
    expect(joinRefusal(borrowed, "ana", false)).toBe("You have this book.");
    expect(joinRefusal(borrowed, "budi", true)).toBe(
      "You're already in line for this book."
    );
    const held = bookState(
      shelf,
      null,
      [reservation(1, "budi", { expiresOn: "2026-11-10", status: "ready" })],
      TODAY
    );
    expect(joinRefusal(held, "citra", false)).toBeNull();
    expect(joinRefusal(held, "budi", true)).toBe(
      "It's reserved for you. Borrow it at the shelf."
    );
    expect(joinRefusal({ kind: "available", queue: 0 }, "budi", false)).toBe(
      "It's on the shelf. Borrow it there."
    );
    expect(joinRefusal({ kind: "offered" }, "budi", false)).toBe(
      "This book isn't on the shelf yet."
    );
    expect(joinRefusal({ kind: "withdrawn" }, "budi", false)).toBe(
      "This book has left the library."
    );
  });
});

describe("memberBookState", () => {
  const borrowed = bookState(
    shelf,
    { dueOn: "2026-11-01", userId: "ana" },
    [],
    TODAY
  );

  it("never says who holds a book", () => {
    const seen = memberBookState(borrowed, "budi");
    expect(seen).toEqual({
      dueOn: "2026-11-01",
      holdEndsOn: null,
      kind: "borrowed",
      mine: false,
      overdue: false,
      position: null,
    });
    expect(JSON.stringify(seen)).not.toContain("ana");
    expect(stateLabel(seen)).toBe("Borrowed until 1 Nov");
  });

  it("tells the holder when it's due or overdue", () => {
    expect(stateLabel(memberBookState(borrowed, "ana"))).toBe(
      "Overdue since 2 Nov"
    );
    const due = bookState(
      shelf,
      { dueOn: "2026-12-07", userId: "ana" },
      [],
      TODAY
    );
    expect(stateLabel(memberBookState(due, "ana"))).toBe("Yours until 7 Dec");
  });

  it("says Reserved for you only to the one it's held for", () => {
    const held = bookState(
      shelf,
      null,
      [reservation(1, "budi", { expiresOn: "2026-11-10", status: "ready" })],
      TODAY
    );
    expect(stateLabel(memberBookState(held, "budi"))).toBe(
      "Reserved for you · until 10 Nov"
    );
    const other = memberBookState(held, "ana");
    expect(stateLabel(other)).toBe("Reserved");
    expect(other.holdEndsOn).toBeNull();
  });

  it("tells a member in line their place", () => {
    const borrowedState = bookState(
      shelf,
      { dueOn: "2026-12-07", userId: "ana" },
      [reservation(1, "budi"), reservation(2, "citra")],
      TODAY
    );
    const seen = memberBookState(borrowedState, "citra", 2);
    expect(seen.position).toBe(2);
    expect(stateLabel(seen)).toBe("Borrowed until 7 Dec");
  });

  it("labels the other states", () => {
    const label = (kind: MemberBookState["kind"]) =>
      stateLabel({
        dueOn: null,
        holdEndsOn: null,
        kind,
        mine: false,
        overdue: false,
        position: null,
      });
    expect(
      ["available", "offered", "withdrawn"].map((kind) =>
        label(kind as MemberBookState["kind"])
      )
    ).toEqual(["Available", "Offered", "Withdrawn"]);
  });
});

const state = (
  kind: MemberBookState["kind"],
  mine = false
): MemberBookState => ({
  dueOn: kind === "borrowed" ? TODAY : null,
  holdEndsOn: null,
  kind,
  mine,
  overdue: false,
  position: null,
});

describe("sortBooks", () => {
  const books = [
    {
      addedAt: new Date("2026-01-01"),
      author: "C. S. Lewis",
      id: 1,
      state: state("borrowed"),
      title: "Mere Christianity",
    },
    {
      addedAt: new Date("2026-03-01"),
      author: "Dietrich Bonhoeffer",
      id: 2,
      state: state("available"),
      title: "The Cost of Discipleship",
    },
    {
      addedAt: new Date("2026-02-01"),
      author: "Amy Carmichael",
      id: 3,
      state: state("reserved", true),
      title: "If",
    },
    {
      addedAt: new Date("2026-04-01"),
      author: "Andrew Murray",
      id: 4,
      state: state("offered"),
      title: "Abide in Christ",
    },
  ];
  const ids = (sort: Parameters<typeof sortBooks>[1]) =>
    sortBooks([...books], sort).map((book) => book.id);

  it("puts what you can take first by default", () => {
    expect(ids("available")).toEqual([3, 2, 1, 4]);
  });

  it("sorts by title, author or newest", () => {
    expect(ids("title")).toEqual([4, 3, 1, 2]);
    expect(ids("author")).toEqual([3, 4, 1, 2]);
    expect(ids("recent")).toEqual([4, 2, 3, 1]);
  });
});

describe("filters", () => {
  it("splits the member list into available and borrowed", () => {
    expect(shownFor(state("reserved", true), "available")).toBe(true);
    expect(shownFor(state("reserved"), "borrowed")).toBe(true);
    expect(shownFor(state("offered"), "available")).toBe(false);
    expect(shownFor(state("offered"), "borrowed")).toBe(false);
    expect(shownFor(state("offered"), "all")).toBe(true);
  });

  it("reads the member list's URL, ignoring unknown values", () => {
    expect(
      libraryFiltersFrom(new URLSearchParams("q=mere&show=lost&sort=title"))
    ).toEqual({ q: "mere", show: "all", sort: "title" });
  });

  it("keeps withdrawn books off the librarian's default view", () => {
    expect(inShelfState({ kind: "withdrawn" }, "shelf")).toBe(false);
    expect(inShelfState({ kind: "withdrawn" }, "withdrawn")).toBe(true);
    const overdue = bookState(
      shelf,
      { dueOn: "2026-11-01", userId: "ana" },
      [],
      TODAY
    );
    expect(inShelfState(overdue, "overdue")).toBe(true);
    expect(inShelfState(overdue, "borrowed")).toBe(true);
  });
});

describe("lending", () => {
  const loan = { dueOn: "2026-12-07", extensions: 0, userId: "ana" };

  it("lends only a book on the shelf with no open loan", () => {
    expect(borrowRefusal({ kind: "available", queue: 0 })).toBeNull();
    expect(
      borrowRefusal({
        dueOn: "2026-12-07",
        holderId: "budi",
        kind: "borrowed",
        overdue: false,
        queue: 0,
      })
    ).toContain("borrowed");
    expect(borrowRefusal({ kind: "offered" })).toContain("isn't on the shelf");
    expect(borrowRefusal({ kind: "withdrawn" })).toContain("left the library");
    expect(
      borrowRefusal({
        holdEndsOn: "2026-11-14",
        kind: "reserved",
        queue: 0,
        reservedFor: "budi",
      })
    ).toContain("held");
    expect(
      borrowRefusal(
        {
          holdEndsOn: "2026-11-14",
          kind: "reserved",
          queue: 0,
          reservedFor: "budi",
        },
        "budi"
      )
    ).toBeNull();
  });

  it("extends by 30 days from the due date, twice, for the holder only", () => {
    expect(extendedDueOn("2026-12-07")).toBe("2027-01-06");
    expect(extendRefusal(loan, "ana", TODAY)).toBeNull();
    expect(extendRefusal({ ...loan, extensions: 1 }, "ana", TODAY)).toBeNull();
    expect(extendRefusal({ ...loan, extensions: 2 }, "ana", TODAY)).toBe(
      "Already extended 2 times. Ask the librarian."
    );
    expect(extendRefusal(loan, "budi", TODAY)).toContain("Only the member");
  });

  it("allows extending on the due date but not after it", () => {
    expect(extendRefusal(loan, "ana", "2026-12-07")).toBeNull();
    expect(extendRefusal(loan, "ana", "2026-12-08")).toBe(
      "It's past the due date. Ask the librarian."
    );
  });

  it("refuses an extension while someone waits", () => {
    expect(extendRefusal(loan, "ana", TODAY, 1)).toBe(
      "Someone is waiting for this book."
    );
  });

  it("labels the due date for the holder", () => {
    expect(dueLabel("2026-12-07", TODAY)).toBe("Due 7 Dec");
    expect(dueLabel("2026-12-07", "2026-12-07")).toBe("Due 7 Dec");
    expect(dueLabel("2026-12-07", "2026-12-09")).toBe("Overdue since 8 Dec");
    expect(extensionsLeftLabel(0)).toBe("2 extensions left");
    expect(extensionsLeftLabel(1)).toBe("1 extension left");
    expect(extensionsLeftLabel(3)).toBe("No extensions left");
  });

  it("accepts only real calendar days", () => {
    expect(isDay("2026-12-07")).toBe(true);
    expect(isDay("2028-02-29")).toBe(true);
    expect(isDay("2027-02-29")).toBe(false);
    expect(isDay("2026-02-30")).toBe(false);
    expect(isDay("2026-13-01")).toBe(false);
    expect(isDay("7 Dec")).toBe(false);
    expect(isDay("2026-12-07T10:00")).toBe(false);
  });
});

describe("lentLabel", () => {
  it("tells the lender where their book is", () => {
    const lent = (overrides: Partial<Parameters<typeof lentLabel>[0]>) =>
      lentLabel(
        {
          dueOn: null,
          holder: null,
          kind: "available",
          overdue: false,
          ...overrides,
        },
        TODAY
      );
    expect(lent({})).toBe("On the shelf");
    expect(
      lent({ dueOn: "2026-12-07", holder: "Budi", kind: "borrowed" })
    ).toBe("Borrowed by Budi until 7 Dec");
    expect(
      lent({
        dueOn: "2026-11-01",
        holder: "Budi",
        kind: "borrowed",
        overdue: true,
      })
    ).toBe("Overdue since 2 Nov, borrowed by Budi");
    expect(lent({ kind: "reserved" })).toBe("Held for the next in line");
    expect(lent({ kind: "offered" })).toBe(
      "Offered. Hand it to the librarian; it appears once accepted."
    );
    expect(lent({ kind: "withdrawn" })).toBe("Withdrawn from the library");
  });
});

describe("languageLabel", () => {
  it("names the three languages with their flags", () => {
    expect(LIBRARY_LANGUAGES.map((language) => language.code)).toEqual([
      "en",
      "de",
      "id",
    ]);
    expect(languageLabel("en")).toEqual({ code: "en", name: "English" });
    expect(languageLabel("de")).toEqual({ code: "de", name: "Deutsch" });
    expect(languageLabel("id")).toEqual({
      code: "id",
      name: "Bahasa Indonesia",
    });
  });

  it("shows a language typed before the list as it was, without a flag", () => {
    expect(languageLabel("Indonesian")).toEqual({
      code: null,
      name: "Indonesian",
    });
  });

  it("has nothing to show without a language", () => {
    expect(languageLabel(null)).toBeNull();
    expect(languageLabel("  ")).toBeNull();
  });
});
