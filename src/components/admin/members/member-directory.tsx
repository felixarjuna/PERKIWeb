"use client";

import {
  type ColumnFiltersState,
  type ColumnPinningState,
  type ColumnVisibilityState,
  functionalUpdate,
  type PaginationState,
  type SortingState,
  type Updater,
  useTable,
} from "@tanstack/react-table";
import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableFacetedFilter } from "~/components/data-table/data-table-faceted-filter";
import { dataTableFeatures } from "~/components/data-table/data-table-features";
import { DataTablePagination } from "~/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "~/components/data-table/data-table-view-options";
import { Button } from "~/components/ui/button";
import { ROLES, roleLabels } from "~/lib/roles";
import { api } from "~/trpc/react";
import { AdminSearch, QueryMessage } from "../admin-controls";
import { createMemberColumns } from "./member-columns";
import MemberDetails from "./member-details";
import {
  birthdayMonthOptions,
  findMember,
  getMemberLocations,
  type Member,
  type MemberFilters,
  memberFilterParams,
  memberId,
  memberSortColumns,
  PAGE_SIZES,
  profileOptions,
  readMemberFilters,
} from "./member-model";

const EMPTY: Member[] = [];
const roleOptions = ROLES.map((role) => ({
  label: roleLabels[role],
  value: role,
}));
const PINNING: ColumnPinningState = { end: [], start: ["name"] };

function updateUrl(values: Record<string, string>, replace = false) {
  const next = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(values)) {
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
  }
  const query = next.toString();
  const url = query ? `/admin/members?${query}` : "/admin/members";
  if (replace) {
    window.history.replaceState(null, "", url);
  } else {
    window.history.pushState(null, "", url);
  }
}

/** Writes filter changes to the URL; any filter change returns to page 1. */
function setFilters(filters: Partial<MemberFilters>, replace = false) {
  updateUrl(memberFilterParams({ page: 1, ...filters }), replace);
}

export default function MemberDirectory() {
  const query = api.profiles.members.useQuery();
  const params = useSearchParams();
  const paramString = params.toString();
  const filters = useMemo(
    () => readMemberFilters(new URLSearchParams(paramString)),
    [paramString]
  );
  const returnFocus = useRef<HTMLElement | null>(null);
  const records = query.data ?? EMPTY;
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({
      birthdayMonth: false,
      search: false,
    });
  const columns = useMemo(
    () =>
      createMemberColumns((member, origin) => {
        returnFocus.current = origin;
        updateUrl({ member: memberId(member) });
      }),
    []
  );
  const locations = useMemo(() => getMemberLocations(records), [records]);

  const sorting = useMemo<SortingState>(() => [filters.sort], [filters.sort]);
  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const active: ColumnFiltersState = [];
    const q = filters.q.trim();
    if (q) {
      active.push({ id: "search", value: q });
    }
    if (filters.locations.length) {
      active.push({ id: "location", value: filters.locations });
    }
    if (filters.birthdayMonths.length) {
      active.push({ id: "birthdayMonth", value: filters.birthdayMonths });
    }
    if (filters.roles.length) {
      active.push({ id: "role", value: filters.roles });
    }
    if (filters.profile.length) {
      active.push({ id: "profile", value: filters.profile });
    }
    return active;
  }, [
    filters.q,
    filters.locations,
    filters.birthdayMonths,
    filters.roles,
    filters.profile,
  ]);
  const pagination = useMemo<PaginationState>(
    () => ({ pageIndex: filters.page - 1, pageSize: filters.pageSize }),
    [filters.page, filters.pageSize]
  );

  const table = useTable({
    autoResetPageIndex: false,
    columns,
    data: records,
    features: dataTableFeatures,
    getRowId: memberId,
    onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => {
      const next = functionalUpdate(updater, columnFilters);
      const values = (id: string) => {
        const value = next.find((filter) => filter.id === id)?.value;
        return Array.isArray(value) ? value.map(String) : [];
      };
      setFilters({
        birthdayMonths: values("birthdayMonth"),
        locations: values("location"),
        profile: values("profile") as MemberFilters["profile"],
        roles: values("role"),
      });
    },
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater: Updater<PaginationState>) => {
      const next = functionalUpdate(updater, pagination);
      const pageSize = next.pageSize === pagination.pageSize;
      updateUrl(
        memberFilterParams({
          page: pageSize ? next.pageIndex + 1 : 1,
          pageSize: next.pageSize,
        })
      );
    },
    onSortingChange: (updater: Updater<SortingState>) => {
      const [next] = functionalUpdate(updater, sorting);
      const id = memberSortColumns.find((column) => column === next?.id);
      setFilters({
        sort: id ? { desc: Boolean(next?.desc), id } : filters.sort,
      });
    },
    state: {
      columnFilters,
      columnPinning: PINNING,
      columnVisibility: {
        ...columnVisibility,
        birthdayMonth: false,
        search: false,
      },
      pagination,
      sorting,
    },
  });

  const pageCount = Math.max(1, table.getPageCount());
  useEffect(() => {
    // Clamp out-of-range pages (e.g. after a filter or a stale link).
    if (query.data && filters.page > pageCount) {
      updateUrl(memberFilterParams({ page: pageCount }), true);
    }
  }, [query.data, filters.page, pageCount]);

  const openMember = params.get("member");
  const selected = findMember(records, openMember);
  const filtered = table.getFilteredRowModel().rows.length;
  const isFiltered = Boolean(
    filters.q ||
      filters.locations.length ||
      filters.birthdayMonths.length ||
      filters.roles.length ||
      filters.profile.length
  );
  const locationColumn = table.getColumn("location");
  const birthdayColumn = table.getColumn("birthdayMonth");
  const roleColumn = table.getColumn("role");
  const profileColumn = table.getColumn("profile");

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <AdminSearch
        className="w-full sm:w-72"
        id="member-search"
        label="Search members"
        onChange={(event) => setFilters({ q: event.target.value }, true)}
        placeholder="Search name, email or phone"
        value={filters.q}
      />
      {locationColumn ? (
        <DataTableFacetedFilter
          column={locationColumn}
          options={locations}
          title="Location"
        />
      ) : null}
      {birthdayColumn ? (
        <DataTableFacetedFilter
          column={birthdayColumn}
          options={birthdayMonthOptions}
          title="Birthday"
        />
      ) : null}
      {roleColumn ? (
        <DataTableFacetedFilter
          column={roleColumn}
          options={roleOptions}
          title="Role"
        />
      ) : null}
      {profileColumn ? (
        <DataTableFacetedFilter
          column={profileColumn}
          options={profileOptions}
          title="Profile"
        />
      ) : null}
      {isFiltered ? (
        <Button
          className="h-10"
          onClick={() =>
            setFilters({
              birthdayMonths: [],
              locations: [],
              profile: [],
              q: "",
              roles: [],
            })
          }
          size="sm"
          type="button"
          variant="ghost"
        >
          Reset
          <X aria-hidden="true" />
        </Button>
      ) : null}
      <div className="ml-auto hidden md:block">
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );

  const details = (
    <MemberDetails
      member={selected}
      onOpenChange={(open) => {
        if (!open) {
          updateUrl({ member: "" });
        }
      }}
      open={Boolean(openMember)}
      returnFocus={returnFocus}
    />
  );

  const status = query.isError ? (
    <QueryMessage
      error
      onRetry={() => {
        query.refetch();
      }}
    />
  ) : (
    <QueryMessage>Loading the member directory…</QueryMessage>
  );

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {toolbar}
      {query.isLoading || query.isError ? (
        status
      ) : (
        <DataTable
          empty={
            records.length
              ? "No members match these filters. Try another search or reset the filters."
              : "No member profiles yet. Registrations will appear here."
          }
          footer={
            <DataTablePagination
              pageSizeOptions={PAGE_SIZES}
              summary={
                isFiltered
                  ? `${filtered} of ${records.length} members`
                  : `${records.length} members`
              }
              table={table}
            />
          }
          label="Fellowship members"
          table={table}
        />
      )}
      {details}
    </div>
  );
}
