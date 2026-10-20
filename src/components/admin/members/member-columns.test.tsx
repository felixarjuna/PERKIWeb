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
import { createMemberColumns } from "./member-columns";
import type { Member } from "./member-model";

const VIEW_DETAILS = /view details/i;

const member = (
  id: string,
  name: string,
  extra: Partial<Member["profiles"]> = {}
): Member => ({
  profiles: {
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
  user: { email: `${name.toLowerCase()}@test.local`, id, image: null, name },
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

function useMemberRows(
  sorting: SortingState,
  columnFilters: ColumnFiltersState = []
) {
  const table = useTable({
    columns: createMemberColumns(vi.fn()),
    data: list,
    features: dataTableFeatures,
    getRowId: (row) => row.profiles.id,
    state: { columnFilters, sorting },
  });
  return table.getRowModel().rows.map((row) => row.id);
}

const rowIds = (sorting: SortingState, columnFilters?: ColumnFiltersState) =>
  renderHook(() => useMemberRows(sorting, columnFilters)).result.current;

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
  });

  it("sorts birthdays in calendar order and keeps missing dates last", () => {
    expect(rowIds([{ desc: false, id: "birthday" }])).toEqual(["a", "b", "c"]);
    expect(rowIds([{ desc: true, id: "birthday" }])).toEqual(["b", "a", "c"]);
    expect(rowIds([{ desc: true, id: "registered" }])).toEqual(["b", "a", "c"]);
    expect(rowIds([{ desc: false, id: "location" }])).toEqual(["b", "a", "c"]);
  });

  it("opens a profile from the pinned member name", async () => {
    const onOpen = vi.fn();
    function Harness() {
      const table = useTable({
        columns: createMemberColumns(onOpen),
        data: list,
        features: dataTableFeatures,
        getRowId: (row) => row.profiles.id,
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
});
