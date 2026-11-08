import { describe, expect, it } from "vitest";
import {
  addDays,
  bookState,
  dueOnFrom,
  HOLD_DAYS,
  holdEndsOn,
  inShelfState,
  LOAN_DAYS,
  libraryFiltersFrom,
  MAX_EXTENSIONS,
  type MemberBookState,
  memberBookState,
  type ReservationLine,
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
    // Budi's hold ran out on the 10th: Citra's starts on the 11th.
    expect(bookState(shelf, null, line, "2026-11-12")).toEqual({
      holdEndsOn: "2026-11-18",
      kind: "reserved",
      queue: 0,
      reservedFor: "citra",
    });
    expect(bookState(shelf, null, line, "2026-11-19")).toEqual({
      kind: "available",
      queue: 0,
    });
  });

  it("waits for a return before anyone's hold starts", () => {
    expect(bookState(shelf, null, [reservation(1, "budi")], TODAY)).toEqual({
      kind: "available",
      queue: 1,
    });
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
    expect(stateLabel(memberBookState(held, "budi"))).toBe("Reserved for you");
    const other = memberBookState(held, "ana");
    expect(stateLabel(other)).toBe("Reserved");
    expect(other.holdEndsOn).toBeNull();
  });

  it("labels the other states", () => {
    const label = (kind: MemberBookState["kind"]) =>
      stateLabel({
        dueOn: null,
        holdEndsOn: null,
        kind,
        mine: false,
        overdue: false,
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
