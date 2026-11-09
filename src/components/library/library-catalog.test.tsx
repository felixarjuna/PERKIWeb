import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MemberBookState } from "~/lib/library";
import LibraryCatalog from "./library-catalog";

const state = vi.hoisted(() => ({
  books: [] as unknown[],
  borrowed: [] as unknown[],
  extended: [] as unknown[],
  input: undefined as unknown,
  joined: [] as unknown[],
  left: [] as unknown[],
  lent: [] as unknown[],
  mine: {
    holding: [] as unknown[],
    past: [] as unknown[],
    queue: [] as unknown[],
  },
  offered: [] as unknown[],
  params: "",
}));
vi.mock("~/trpc/react", () => {
  const mutation = (calls: unknown[]) => () => ({
    isPending: false,
    mutate: (input: unknown) => calls.push(input),
  });
  return {
    api: {
      library: {
        borrow: { useMutation: mutation(state.borrowed) },
        extend: { useMutation: mutation(state.extended) },
        joinQueue: { useMutation: mutation(state.joined) },
        leaveQueue: { useMutation: mutation(state.left) },
        list: {
          useQuery: (input: unknown) => {
            state.input = input;
            return { data: state.books, isPlaceholderData: false };
          },
        },
        mine: { useQuery: () => ({ data: state.mine }) },
        myLentBooks: { useQuery: () => ({ data: state.lent }) },
        offer: { useMutation: mutation(state.offered) },
      },
      useUtils: () => ({ library: { invalidate: vi.fn() } }),
    },
  };
});
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(state.params),
}));

const BORROW = /^Borrow/;

const free: MemberBookState = {
  dueOn: null,
  holdEndsOn: null,
  kind: "available",
  mine: false,
  overdue: false,
  position: null,
};

const book = (id: number, title: string, bookState = free) => ({
  addedAt: new Date("2026-11-01"),
  author: "C. S. Lewis",
  description: id === 1 ? "On what Christians believe." : null,
  id,
  language: id === 1 ? "de" : null,
  state: bookState,
  title,
});

describe("LibraryCatalog", () => {
  beforeEach(() => {
    state.books = [];
    state.borrowed.length = 0;
    state.extended.length = 0;
    state.joined.length = 0;
    state.left.length = 0;
    state.lent = [];
    state.offered.length = 0;
    state.mine = { holding: [], past: [], queue: [] };
    state.params = "";
  });

  it("says the shelf is empty before any book is added", () => {
    render(<LibraryCatalog />);
    expect(screen.getByText("The shelf is empty for now")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
  });

  it("offers clearing filters when nothing matches", () => {
    state.params = "q=narnia&show=available";
    render(<LibraryCatalog />);
    expect(screen.getByText("No available books match “narnia”.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(
      screen.getByRole("searchbox", { name: "Search books" })
    ).toHaveProperty("value", "");
  });

  it("lists books with their state, never a holder", () => {
    state.params = "sort=title";
    state.books = [
      book(1, "Mere Christianity"),
      book(2, "The Screwtape Letters", {
        ...free,
        dueOn: "2026-12-07",
        kind: "borrowed",
      }),
    ];
    render(<LibraryCatalog />);
    expect(state.input).toEqual({ q: undefined, show: "all", sort: "title" });
    expect(screen.getByText("2 books")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Mere Christianity" })
    ).toBeTruthy();
    const card = screen
      .getByRole("heading", { name: "Mere Christianity" })
      .closest("article");
    expect(card?.textContent).toContain("C. S. LewisDeutsch");
    expect(screen.getByText("Available")).toBeTruthy();
    expect(screen.getByText("Borrowed until 7 Dec")).toBeTruthy();
  });

  it("confirms a Borrow with the lending time before starting the loan", () => {
    vi.useFakeTimers({
      now: new Date("2026-11-07T11:00:00Z"),
      toFake: ["Date"],
    });
    state.books = [
      book(1, "Mere Christianity"),
      book(2, "The Screwtape Letters", {
        ...free,
        dueOn: "2026-12-07",
        kind: "borrowed",
      }),
    ];
    render(<LibraryCatalog />);
    expect(
      screen.queryByRole("button", { name: "Borrow The Screwtape Letters" })
    ).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Borrow Mere Christianity" })
    );
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.textContent).toContain("Borrow Mere Christianity?");
    expect(dialog.textContent).toContain(
      "You have it until 7 Dec, 30 days. You can extend twice from My books. Bring it back to the librarian."
    );
    expect(state.borrowed).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Borrow" }));
    expect(state.borrowed).toEqual([{ id: 1 }]);
    vi.useRealTimers();
  });

  it("shows My books with the due date and why Extend is off", () => {
    vi.useFakeTimers({
      now: new Date("2026-11-07T11:00:00Z"),
      toFake: ["Date"],
    });
    const held = {
      author: "C. S. Lewis",
      bookId: 1,
      dueOn: "2026-12-07",
      extendRefusal: null,
      extensions: 0,
      loanId: 11,
      overdue: false,
      title: "Mere Christianity",
    };
    state.mine = {
      holding: [
        held,
        {
          ...held,
          bookId: 2,
          dueOn: "2026-11-01",
          extendRefusal: "It's past the due date. Ask the librarian.",
          loanId: 12,
          overdue: true,
          title: "The Four Loves",
        },
      ],
      past: [
        {
          author: "C. S. Lewis",
          borrowedAt: new Date("2026-09-01"),
          returnedAt: new Date("2026-10-01"),
          title: "Miracles",
        },
      ],
      queue: [],
    };
    state.books = [book(1, "Mere Christianity")];
    render(<LibraryCatalog />);
    expect(screen.getByRole("heading", { name: "My books" })).toBeTruthy();
    expect(screen.getByText("Due 7 Dec")).toBeTruthy();
    expect(screen.getByText("Overdue since 2 Nov")).toBeTruthy();
    expect(screen.getByText("Past borrows (1)")).toBeTruthy();
    const late = screen.getByRole("button", { name: "Extend The Four Loves" });
    expect(late).toHaveProperty("disabled", true);
    expect(
      screen.getByText("It's past the due date. Ask the librarian.")
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Extend Mere Christianity" })
    );
    expect(state.extended).toEqual([{ loanId: 11 }]);
    vi.useRealTimers();
  });

  it("queues for a borrowed book and shows the place in line", () => {
    state.books = [
      book(1, "Mere Christianity", {
        ...free,
        dueOn: "2026-12-07",
        kind: "borrowed",
      }),
      book(2, "The Four Loves", {
        ...free,
        dueOn: "2026-12-07",
        kind: "borrowed",
        position: 2,
      }),
    ];
    render(<LibraryCatalog />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Join the queue for Mere Christianity",
      })
    );
    expect(state.joined).toEqual([{ id: 1 }]);
    expect(screen.getByText("2nd in line")).toBeTruthy();
    expect(
      screen.queryByRole("button", {
        name: "Join the queue for The Four Loves",
      })
    ).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Leave the queue for The Four Loves" })
    );
    expect(state.left).toEqual([{ id: 2 }]);
  });

  it("lets the member it's reserved for borrow it", () => {
    state.books = [
      book(1, "Mere Christianity", {
        ...free,
        holdEndsOn: "2026-11-14",
        kind: "reserved",
        mine: true,
      }),
    ];
    render(<LibraryCatalog />);
    expect(screen.getByText("Reserved for you · until 14 Nov")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Borrow Mere Christianity" })
    ).toBeTruthy();
  });

  it("tells the member who offered a book to hand it over", async () => {
    state.books = [
      book(1, "Nachfolge", { ...free, kind: "offered", mine: true }),
      book(2, "Miracles", { ...free, kind: "offered" }),
    ];
    render(<LibraryCatalog />);
    expect(
      screen.getByText("Hand it to the librarian; it appears once accepted.")
    ).toBeTruthy();
    expect(screen.getByText("Not on the shelf yet.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: BORROW })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Offer a book" }));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Life Together" },
    });
    fireEvent.change(screen.getByLabelText("Author"), {
      target: { value: "Dietrich Bonhoeffer" },
    });
    await userEvent.click(screen.getByRole("combobox", { name: "Language" }));
    await userEvent.click(
      screen.getByRole("option", { name: "Bahasa Indonesia" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Offer book" }));
    expect(state.offered).toEqual([
      {
        author: "Dietrich Bonhoeffer",
        description: "",
        language: "id",
        title: "Life Together",
      },
    ]);
  });

  it("shows what the member waits for and the books they lend", () => {
    vi.useFakeTimers({
      now: new Date("2026-11-07T11:00:00Z"),
      toFake: ["Date"],
    });
    state.mine = {
      holding: [],
      past: [],
      queue: [
        {
          author: "C. S. Lewis",
          bookId: 1,
          holdEndsOn: "2026-11-14",
          position: null,
          title: "Mere Christianity",
        },
        {
          author: "C. S. Lewis",
          bookId: 2,
          holdEndsOn: null,
          position: 1,
          title: "The Four Loves",
        },
      ],
    };
    state.lent = [
      {
        author: "Dietrich Bonhoeffer",
        dueOn: "2026-12-07",
        holder: "Budi Santoso",
        id: 3,
        kind: "borrowed",
        language: "de",
        loans: [
          {
            borrowedAt: new Date("2026-11-07T11:00:00Z"),
            borrower: "Budi Santoso",
            returnedAt: null,
          },
        ],
        overdue: false,
        title: "Nachfolge",
      },
    ];
    render(<LibraryCatalog />);
    const waiting = screen.getByRole("region", { name: "Waiting for" });
    expect(waiting.textContent).toContain("Reserved for you · until 14 Nov");
    expect(waiting.textContent).toContain("1st in line");
    const lent = screen.getByRole("region", { name: "Books you lend" });
    expect(lent.textContent).toContain("Dietrich BonhoefferDeutsch");
    expect(lent.textContent).toContain("Borrowed by Budi Santoso until 7 Dec");
    expect(lent.textContent).toContain("Lent 1 time");
    // The lends only: who, from and to; never the librarian's event log.
    expect(lent.textContent).toContain(
      "Budi Santoso · from 7 Nov 2026, has it now"
    );
    for (const logWording of ["History", "Returned", "Joined the queue"]) {
      expect(lent.textContent).not.toContain(logWording);
    }
    vi.useRealTimers();
  });
});
