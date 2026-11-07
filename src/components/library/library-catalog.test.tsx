import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MemberBookState } from "~/lib/library";
import LibraryCatalog from "./library-catalog";

const state = vi.hoisted(() => ({
  books: [] as unknown[],
  borrowed: [] as unknown[],
  extended: [] as unknown[],
  input: undefined as unknown,
  mine: { holding: [] as unknown[], past: [] as unknown[] },
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
        list: {
          useQuery: (input: unknown) => {
            state.input = input;
            return { data: state.books, isPlaceholderData: false };
          },
        },
        mine: { useQuery: () => ({ data: state.mine }) },
      },
      useUtils: () => ({ library: { invalidate: vi.fn() } }),
    },
  };
});
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(state.params),
}));

const free: MemberBookState = {
  dueOn: null,
  holdEndsOn: null,
  kind: "available",
  mine: false,
  overdue: false,
};

const book = (id: number, title: string, bookState = free) => ({
  addedAt: new Date("2026-11-01"),
  author: "C. S. Lewis",
  description: id === 1 ? "On what Christians believe." : null,
  id,
  language: id === 1 ? "English" : null,
  state: bookState,
  title,
});

describe("LibraryCatalog", () => {
  beforeEach(() => {
    state.books = [];
    state.borrowed.length = 0;
    state.extended.length = 0;
    state.mine = { holding: [], past: [] };
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
    expect(screen.getByText("C. S. Lewis · English")).toBeTruthy();
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
});
