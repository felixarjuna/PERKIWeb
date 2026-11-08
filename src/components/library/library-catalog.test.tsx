import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MemberBookState } from "~/lib/library";
import LibraryCatalog from "./library-catalog";

const state = vi.hoisted(() => ({
  books: [] as unknown[],
  input: undefined as unknown,
  params: "",
}));
vi.mock("~/trpc/react", () => ({
  api: {
    library: {
      list: {
        useQuery: (input: unknown) => {
          state.input = input;
          return { data: state.books, isPlaceholderData: false };
        },
      },
    },
  },
}));
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
});
