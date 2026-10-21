import {
  type ColumnFiltersState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { render, renderHook, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "~/components/data-table/data-table";
import { dataTableFeatures } from "~/components/data-table/data-table-features";
import type { Role } from "~/lib/roles";
import { createMemberColumns } from "./member-columns";
import type { Member } from "./member-model";

const VIEW_DETAILS = /view details/i;
const EMIL = /Emil/;

const member = (
  id: string,
  name: string,
  extra: Partial<NonNullable<Member["profiles"]>> | null = {}
): Member => ({
  profiles: extra && {
    address: null,
    bio: null,
    birthday: null,
    createdAt: null,
    id,
    location: null,
    major: null,
    phoneNumber: null,
    updatedAt: null,
    userId: id,
    ...extra,
  },
  user: {
    createdAt: null,
    email: `${name.toLowerCase()}@test.local`,
    id,
    image: null,
    name,
    role: "member" as const,
  },
});
const list = [
  member("b", "Ben", {
    birthday: new Date("1990-10-22"),
    createdAt: new Date("2026-09-30T22:30:00Z"),
    location: " Aachen ",
    phoneNumber: "+49123",
  }),
  member("a", "Anna", {
    birthday: new Date("2001-01-04"),
    createdAt: new Date("2026-09-01T12:00:00Z"),
    location: "aachen",
  }),
  member("c", "Cara"),
];
const withRole = (base: Member, role: Role): Member => ({
  ...base,
  user: { ...base.user, role },
});
const roleList = [
  withRole(member("m", "Mo"), "member"),
  withRole(member("w", "Wes"), "writer"),
  withRole(member("o", "Olga"), "owner"),
  withRole(member("t", "Tim"), "mita"),
];

function useMemberRows(
  sorting: SortingState,
  columnFilters: ColumnFiltersState = [],
  data: Member[] = list
) {
  const table = useTable({
    columns: createMemberColumns(vi.fn()),
    data,
    features: dataTableFeatures,
    getRowId: (row) => row.user.id,
    state: { columnFilters, sorting },
  });
  return table.getRowModel().rows.map((row) => row.id);
}

const rowIds = (
  sorting: SortingState,
  columnFilters?: ColumnFiltersState,
  data?: Member[]
) =>
  renderHook(() => useMemberRows(sorting, columnFilters, data)).result.current;

describe("member table", () => {
  it("searches name, email and phone and filters by location", () => {
    const byName = [{ desc: false, id: "name" }];
    expect(rowIds(byName, [{ id: "search", value: "BEN@TEST" }])).toEqual([
      "b",
    ]);
    expect(
      rowIds(byName, [
        { id: "search", value: "123" },
        { id: "location", value: ["aachen"] },
      ])
    ).toEqual(["b"]);
    expect(rowIds(byName, [{ id: "location", value: ["missing"] }])).toEqual([
      "c",
    ]);
    expect(
      rowIds(byName, [{ id: "location", value: ["aachen", "missing"] }])
    ).toEqual(["a", "b", "c"]);
    // Birthday month: Ben is October, Anna January, Cara has none.
    expect(rowIds(byName, [{ id: "birthdayMonth", value: ["10"] }])).toEqual([
      "b",
    ]);
    expect(
      rowIds(byName, [{ id: "birthdayMonth", value: ["1", "10"] }])
    ).toEqual(["a", "b"]);
  });

  it("sorts birthdays in calendar order and keeps missing dates last", () => {
    expect(rowIds([{ desc: false, id: "birthday" }])).toEqual(["a", "b", "c"]);
    expect(rowIds([{ desc: true, id: "birthday" }])).toEqual(["b", "a", "c"]);
    expect(rowIds([{ desc: true, id: "registered" }])).toEqual(["b", "a", "c"]);
    expect(rowIds([{ desc: false, id: "location" }])).toEqual(["b", "a", "c"]);
  });

  it("filters by role and sorts owner, mita, writer, member", () => {
    const byName = [{ desc: false, id: "name" }];
    expect(
      rowIds(byName, [{ id: "role", value: ["writer"] }], roleList)
    ).toEqual(["w"]);
    expect(rowIds([{ desc: false, id: "role" }], [], roleList)).toEqual([
      "o",
      "t",
      "w",
      "m",
    ]);
  });

  it("shows and filters profile state", () => {
    const people = [
      member("n", "Nia", null),
      member("h", "Hal", {
        birthday: new Date("1990-10-22"),
        location: "Aachen",
        phoneNumber: "+49",
      }),
      member("f", "Fay", {
        address: "Street 1",
        birthday: new Date("1990-10-22"),
        location: "Aachen",
        major: "CS",
        phoneNumber: "+49",
      }),
    ];
    const byName = [{ desc: false, id: "name" }];
    expect(
      rowIds(byName, [{ id: "profile", value: ["incomplete"] }], people)
    ).toEqual(["h"]);
    expect(
      rowIds(
        byName,
        [{ id: "profile", value: ["not-started", "complete"] }],
        people
      )
    ).toEqual(["f", "n"]);
    expect(rowIds([{ desc: true, id: "profile" }], [], people)).toEqual([
      "f",
      "h",
      "n",
    ]);

    function Harness() {
      const table = useTable({
        columns: createMemberColumns(vi.fn()),
        data: people,
        features: dataTableFeatures,
        getRowId: (row) => row.user.id,
        state: { columnVisibility: { search: false }, sorting: byName },
      });
      return <DataTable empty="None" label="Members" table={table} />;
    }
    render(<Harness />);
    expect(screen.getByText("Not started")).toBeTruthy();
    expect(screen.getByText("3 of 5")).toBeTruthy();
    expect(screen.getByText("Complete")).toBeTruthy();
    // Each state has its own icon, so it reads at a glance.
    const icon = (text: string) =>
      screen.getByText(text).closest("span")?.querySelector("svg")?.classList;
    expect(icon("Complete")?.contains("lucide-circle-check")).toBe(true);
    expect(icon("3 of 5")?.contains("lucide-circle-dashed")).toBe(true);
    expect(icon("Not started")?.contains("lucide-circle")).toBe(true);
  });

  it("opens a profile from the pinned member name", async () => {
    const onOpen = vi.fn();
    function Harness() {
      const table = useTable({
        columns: createMemberColumns(onOpen),
        data: list,
        features: dataTableFeatures,
        getRowId: (row) => row.user.id,
        state: {
          columnPinning: { end: [], start: ["name"] },
          columnVisibility: { search: false },
        },
      });
      return <DataTable empty="None" label="Members" table={table} />;
    }
    render(<Harness />);
    const table = screen.getByRole("table", { name: "Members" });
    expect(
      within(table).queryByRole("button", { name: VIEW_DETAILS })
    ).toBeNull();
    await userEvent.click(within(table).getByRole("button", { name: "Anna" }));
    expect(onOpen).toHaveBeenCalledWith(
      list[1],
      within(table).getByRole("button", { name: "Anna" })
    );
  });

  it("shows address and bio, truncated with the full text on hover", () => {
    const bio = "Loves music, hiking and long Sunday lunches with friends.";
    const people = [
      member("d", "Dora", { address: "Musterstraße 1, Aachen", bio }),
      member("e", "Emil"),
    ];
    function Harness() {
      const table = useTable({
        columns: createMemberColumns(vi.fn()),
        data: people,
        features: dataTableFeatures,
        getRowId: (row) => row.user.id,
        state: { columnVisibility: { search: false } },
      });
      return <DataTable empty="None" label="Members" table={table} />;
    }
    render(<Harness />);
    const table = screen.getByRole("table", { name: "Members" });
    expect(
      within(table).getByRole("columnheader", { name: "Address" })
    ).toBeTruthy();
    expect(
      within(table).getByRole("columnheader", { name: "Bio" })
    ).toBeTruthy();
    expect(within(table).getByText("Musterstraße 1, Aachen")).toBeTruthy();
    expect(within(table).getByTitle(bio).textContent).toBe(bio);
    const emil = within(table).getByRole("row", { name: EMIL });
    expect(
      within(emil).getAllByText("Not provided").length
    ).toBeGreaterThanOrEqual(2);
  });
});
