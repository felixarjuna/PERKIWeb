import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RouterOutputs } from "~/trpc/react";
import { columns } from "./columns";
import DataTable from "./data-table";

type ProfileRow = RouterOutputs["profiles"]["getUserProfiles"][number];

const COLUMN_COUNT = 7;
const BIRTHDAY_HEADING = /Birthday this month/;
const DEFAULT_PAGE_SIZE = 10;

let nextId = 0;
const profile = (
  name: string | null,
  birthday: Date | null,
  extra: Partial<ProfileRow["profiles"]> = {}
): ProfileRow => {
  nextId += 1;
  const id = `user-${nextId}`;
  return {
    profiles: {
      address: `Street ${nextId}`,
      bio: null,
      birthday,
      createdAt: null,
      id: `profile-${nextId}`,
      location: "Aachen",
      major: "CS",
      phoneNumber: `+49${nextId}`,
      updatedAt: null,
      userId: id,
      ...extra,
    },
    user:
      name === null
        ? null
        : { email: `${id}@test.local`, id, image: null, name },
  };
};

/** Mid-day local dates so no timezone can shift the calendar day. */
const day = (year: number, month: number, date: number) =>
  new Date(year, month - 1, date, 12);

const renderTable = (data: ProfileRow[]) =>
  render(<DataTable columns={columns} data={data} />);

/** Text of column `index` for every body row, in display order. */
const columnValues = (index: number) => {
  const [, ...bodyRows] = screen.getAllByRole("row");
  return bodyRows.map(
    (row) => within(row).getAllByRole("cell")[index]?.textContent ?? ""
  );
};
const names = () => columnValues(0);

const headerButton = (name: string) =>
  screen.getByRole("button", { name: new RegExp(`^${name}`) });

const pageButton = (label: string) =>
  screen.getByRole("button", { name: label }) as HTMLButtonElement;

describe("dashboard DataTable", () => {
  beforeEach(() => {
    nextId = 0;
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2025-04-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a header for every column and one row per profile", () => {
    renderTable([
      profile("Anna", day(1999, 4, 10), { major: "Physics" }),
      profile("Ben", null, { bio: "Hello", location: "Köln" }),
    ]);

    const headers = screen
      .getAllByRole("columnheader")
      .map((header) => header.textContent);
    expect(headers).toEqual([
      "Name",
      "Birthday",
      "Major",
      "Phone Number",
      "Location",
      "Address",
      "Bio",
    ]);
    expect(screen.getAllByRole("row")).toHaveLength(3);

    const [, anna, ben] = screen.getAllByRole("row");
    const annaCells = within(anna as HTMLElement).getAllByRole("cell");
    expect(annaCells).toHaveLength(COLUMN_COUNT);
    expect(annaCells.map((cell) => cell.textContent)).toEqual([
      "Anna",
      "10 April 1999",
      "Physics",
      "+491",
      "Aachen",
      "Street 1",
      "",
    ]);
    const benCells = within(ben as HTMLElement).getAllByRole("cell");
    expect(benCells[1]?.textContent).toBe("N/A");
    expect(benCells[4]?.textContent).toBe("Köln");
    expect(benCells[6]?.textContent).toBe("Hello");
  });

  it("formats birthdays in Indonesian long form", () => {
    renderTable([profile("Anna", day(2000, 8, 17))]);
    expect(columnValues(1)).toEqual(["17 Agustus 2000"]);
  });

  it("shows 'No results.' spanning all columns when empty", () => {
    renderTable([]);
    const cell = screen.getByRole("cell", { name: "No results." });
    expect(cell.getAttribute("colspan")).toBe(String(COLUMN_COUNT));
    expect(screen.getByText("Page 1 of 0")).toBeDefined();
  });

  it("applies the column sizes as header widths", () => {
    renderTable([profile("Anna", null)]);
    const widths = screen
      .getAllByRole("columnheader")
      .map((header) => header.style.width);
    // Phone Number and Location have no explicit size (TanStack default 150).
    expect(widths).toEqual([
      "200px",
      "200px",
      "400px",
      "150px",
      "150px",
      "400px",
      "300px",
    ]);
  });

  describe("sorting", () => {
    it("sorts by name ascending by default", () => {
      renderTable([
        profile("Cara", null),
        profile("Anna", null),
        profile("Ben", null),
      ]);
      expect(names()).toEqual(["Anna", "Ben", "Cara"]);
    });

    it("toggles name to descending and back", async () => {
      const user = userEvent.setup();
      renderTable([
        profile("Cara", null),
        profile("Anna", null),
        profile("Ben", null),
      ]);

      await user.click(headerButton("Name"));
      expect(names()).toEqual(["Cara", "Ben", "Anna"]);

      await user.click(headerButton("Name"));
      expect(names()).toEqual(["Anna", "Ben", "Cara"]);
    });

    it("sorts rows without a linked user (null name) after named ones", () => {
      renderTable([
        profile(null, null),
        profile("Ben", null),
        profile("Anna", null),
      ]);
      expect(names()).toEqual(["Anna", "Ben", ""]);
    });

    it("sorts birthdays by month/day ignoring the year, nulls last", async () => {
      const user = userEvent.setup();
      renderTable([
        profile("Anna", day(1990, 12, 1)),
        profile("Ben", null),
        profile("Cara", day(2005, 1, 20)),
        profile("Dan", day(1980, 6, 15)),
        profile("Eve", day(2001, 1, 5)),
        profile("Finn", null),
        profile("Gus", day(1999, 6, 2)),
      ]);

      await user.click(headerButton("Birthday"));

      expect(names()).toEqual([
        "Eve", // Jan 05 2001
        "Cara", // Jan 20 2005
        "Gus", // Jun 02 1999
        "Dan", // Jun 15 1980
        "Anna", // Dec 01 1990
        "Ben", // null
        "Finn", // null
      ]);
    });

    it("replaces the name sort instead of adding a secondary sort", async () => {
      const user = userEvent.setup();
      renderTable([
        profile("Zed", day(2000, 3, 1)),
        profile("Amy", day(2000, 9, 1)),
      ]);
      expect(names()).toEqual(["Amy", "Zed"]);

      await user.click(headerButton("Birthday"));
      expect(names()).toEqual(["Zed", "Amy"]);
    });

    it("keeps same-day birthdays from different years together", async () => {
      const user = userEvent.setup();
      renderTable([
        profile("A", day(1990, 5, 10)),
        profile("B", day(2010, 5, 9)),
        profile("C", day(1970, 5, 10)),
        profile("D", day(2000, 5, 11)),
      ]);

      await user.click(headerButton("Birthday"));

      const order = names();
      expect(order[0]).toBe("B");
      expect(order.slice(1, 3).sort()).toEqual(["A", "C"]);
      expect(order[3]).toBe("D");
    });

    it("sorts birthdays descending on the second click", async () => {
      const user = userEvent.setup();
      renderTable([
        profile("Anna", day(1990, 12, 1)),
        profile("Cara", day(2005, 1, 20)),
        profile("Dan", day(1980, 6, 15)),
      ]);

      await user.click(headerButton("Birthday"));
      await user.click(headerButton("Birthday"));

      expect(names()).toEqual(["Anna", "Dan", "Cara"]);
    });

    // BUG: sortByMonth returns "null sorts after everything", but TanStack
    // negates the comparator for descending order, so profiles without a
    // birthday jump to the TOP when sorting birthdays descending (received:
    // ["Ben", "Anna", "Dan", "Cara"]). Returning nulls via `sortUndefined:
    // "last"` / an accessor yielding undefined would keep them at the bottom.
    it.fails("keeps null birthdays last when sorting descending", async () => {
      const user = userEvent.setup();
      renderTable([
        profile("Anna", day(1990, 12, 1)),
        profile("Ben", null),
        profile("Cara", day(2005, 1, 20)),
        profile("Dan", day(1980, 6, 15)),
      ]);

      await user.click(headerButton("Birthday"));
      await user.click(headerButton("Birthday"));

      expect(names()).toEqual(["Anna", "Dan", "Cara", "Ben"]);
    });

    it("highlights the header of the ascending-sorted column", async () => {
      const user = userEvent.setup();
      renderTable([profile("Anna", day(1990, 1, 1))]);
      // variant="default" renders bg-primary, variant="ghost" does not.
      const isHighlighted = (name: string) =>
        headerButton(name).classList.contains("bg-primary");

      expect(isHighlighted("Name")).toBe(true);
      expect(isHighlighted("Birthday")).toBe(false);

      await user.click(headerButton("Birthday"));

      expect(isHighlighted("Name")).toBe(false);
      expect(isHighlighted("Birthday")).toBe(true);
    });
  });

  describe("pagination", () => {
    const many = (count: number) =>
      Array.from({ length: count }, (_, index) =>
        profile(`User ${String(index + 1).padStart(2, "0")}`, null)
      );

    it("shows 10 rows per page by default", () => {
      renderTable(many(25));
      expect(names()).toHaveLength(DEFAULT_PAGE_SIZE);
      expect(names()[0]).toBe("User 01");
      expect(screen.getByText("Page 1 of 3")).toBeDefined();
      expect(screen.getByRole("combobox").textContent).toBe(
        String(DEFAULT_PAGE_SIZE)
      );
    });

    it("pages forward and back with next/previous", async () => {
      const user = userEvent.setup();
      renderTable(many(25));

      expect(pageButton("Go to previous page").disabled).toBe(true);
      expect(pageButton("Go to first page").disabled).toBe(true);

      await user.click(pageButton("Go to next page"));
      expect(screen.getByText("Page 2 of 3")).toBeDefined();
      expect(names()[0]).toBe("User 11");

      await user.click(pageButton("Go to next page"));
      expect(screen.getByText("Page 3 of 3")).toBeDefined();
      expect(names()).toEqual([
        "User 21",
        "User 22",
        "User 23",
        "User 24",
        "User 25",
      ]);
      expect(pageButton("Go to next page").disabled).toBe(true);
      expect(pageButton("Go to last page").disabled).toBe(true);

      await user.click(pageButton("Go to previous page"));
      expect(screen.getByText("Page 2 of 3")).toBeDefined();
      expect(names()[0]).toBe("User 11");
    });

    it("jumps to the first and last page", async () => {
      const user = userEvent.setup();
      renderTable(many(25));

      await user.click(pageButton("Go to last page"));
      expect(screen.getByText("Page 3 of 3")).toBeDefined();

      await user.click(pageButton("Go to first page"));
      expect(screen.getByText("Page 1 of 3")).toBeDefined();
      expect(names()[0]).toBe("User 01");
    });

    it("disables all navigation when everything fits on one page", () => {
      renderTable(many(DEFAULT_PAGE_SIZE));
      expect(screen.getByText("Page 1 of 1")).toBeDefined();
      for (const label of [
        "Go to first page",
        "Go to previous page",
        "Go to next page",
        "Go to last page",
      ]) {
        expect(pageButton(label).disabled).toBe(true);
      }
    });

    it("sorts across all pages, not just the visible one", async () => {
      const user = userEvent.setup();
      const data = many(15);
      // Give only the last user (on page 2 by name) the earliest birthday.
      data[14] = profile("User 15", day(1990, 1, 1));
      renderTable(data);
      expect(names()).not.toContain("User 15");

      await user.click(headerButton("Birthday"));
      expect(names()[0]).toBe("User 15");
    });

    it("changes the page size via the rows-per-page select", async () => {
      const user = userEvent.setup();
      renderTable(many(25));

      await user.click(screen.getByRole("combobox"));
      await user.click(screen.getByRole("option", { name: "20" }));

      expect(names()).toHaveLength(20);
      expect(screen.getByText("Page 1 of 2")).toBeDefined();
      expect(screen.getByRole("combobox").textContent).toBe("20");
    });

    it("reports the selected row count", () => {
      renderTable(many(25));
      expect(screen.getByText("0 of 25 row(s) selected.")).toBeDefined();
    });
  });

  describe("birthday this month", () => {
    const countText = () =>
      screen.getByText(BIRTHDAY_HEADING).nextElementSibling?.textContent;

    it("counts profiles whose birthday falls in the current month", () => {
      renderTable([
        profile("Anna", day(1999, 4, 1)),
        profile("Ben", day(2003, 4, 30)),
        profile("Cara", day(1999, 5, 1)),
        profile("Dan", null),
      ]);
      expect(countText()).toBe("2");
    });

    it("counts all profiles, not only the visible page", () => {
      const data = Array.from({ length: 15 }, (_, index) =>
        profile(`User ${String(index + 1).padStart(2, "0")}`, day(2000, 4, 1))
      );
      renderTable(data);
      expect(countText()).toBe("15");
    });

    it("is 0 when no birthdays are this month", () => {
      renderTable([profile("Anna", day(1999, 3, 31)), profile("Ben", null)]);
      expect(countText()).toBe("0");
    });
  });
});
