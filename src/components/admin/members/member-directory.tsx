"use client";

import { ArrowRight, Search, UsersRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";
import { AdminSelect, QueryMessage } from "../admin-controls";
import MemberDetails from "./member-details";
import {
  filterAndSortMembers,
  getMemberLocations,
  memberDate,
  memberName,
  memberSorts,
  PAGE_SIZES,
  readMemberFilters,
} from "./member-model";

export default function MemberDirectory() {
  const query = api.profiles.getUserProfiles.useQuery();
  const params = useSearchParams();
  const filters = readMemberFilters(new URLSearchParams(params.toString()));
  const returnFocus = useRef<HTMLElement | null>(null);
  const records = query.data ?? [];
  const filtered = filterAndSortMembers(records, filters);
  const pageCount = Math.max(1, Math.ceil(filtered.length / filters.pageSize));
  const page = Math.min(filters.page, pageCount);
  const start = (page - 1) * filters.pageSize;
  const pageRows = filtered.slice(start, start + filters.pageSize);
  const memberId = params.get("member");
  const selected = records.find((member) => member.profiles.id === memberId);
  const update = (values: Record<string, string>, replace = false) => {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(values)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }
    const url = `/admin/members?${next}`;
    if (replace) {
      window.history.replaceState(null, "", url);
    } else {
      window.history.pushState(null, "", url);
    }
  };
  useEffect(() => {
    if (query.data && filters.page !== page) {
      const next = new URLSearchParams(window.location.search);
      next.set("page", String(page));
      window.history.replaceState(null, "", `/admin/members?${next}`);
    }
  }, [query.data, filters.page, page]);
  const controls = (
    <div className="grid gap-4 rounded-xl bg-card p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_12rem_14rem]">
      <div className="flex min-w-0 flex-col gap-2">
        <Label
          className="type-caption text-muted-foreground"
          htmlFor="member-search"
        >
          Search members
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground">
            <title>Search</title>
          </Search>
          <Input
            className="h-11 pl-10"
            id="member-search"
            onChange={(event) =>
              update({ page: "", q: event.target.value }, true)
            }
            placeholder="Name, email or phone"
            type="search"
            value={filters.q}
          />
        </div>
      </div>
      <AdminSelect
        id="member-location"
        label="Location"
        onChange={(location) => update({ location, page: "" })}
        value={filters.location}
      >
        <option value="">All locations</option>
        {getMemberLocations(records).map((location) => (
          <option key={location.value} value={location.value}>
            {location.label}
          </option>
        ))}
      </AdminSelect>
      <AdminSelect
        id="member-sort"
        label="Sort by"
        onChange={(sort) => update({ page: "", sort })}
        value={filters.sort}
      >
        {memberSorts.map((sort) => (
          <option key={sort.value} value={sort.value}>
            {sort.label}
          </option>
        ))}
      </AdminSelect>
    </div>
  );
  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-5">
        {controls}
        <QueryMessage>Loading the member directory…</QueryMessage>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="flex flex-col gap-5">
        {controls}
        <QueryMessage
          error
          onRetry={() => {
            query.refetch();
          }}
        />
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="type-body-sm flex items-center gap-2 text-muted-foreground">
          <UsersRound className="size-4">
            <title>Members</title>
          </UsersRound>
          {records.length} registered members
        </p>
        <p className="type-caption text-muted-foreground">
          {query.isFetching ? "Refreshing…" : "Your fellowship, in one place"}
        </p>
      </div>
      {controls}
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="type-caption text-muted-foreground">
          {filtered.length} matching{" "}
          {filtered.length === 1 ? "member" : "members"}
        </p>
        {filters.q || filters.location ? (
          <Button
            onClick={() => update({ location: "", page: "", q: "" })}
            size="sm"
            type="button"
            variant="ghost"
          >
            Clear filters
          </Button>
        ) : null}
      </div>
      {pageRows.length ? (
        <>
          <div className="hidden overflow-hidden rounded-xl bg-card md:block">
            <Table aria-label="Fellowship members">
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  {["Member", "Location", "Birthday", "Registered", ""].map(
                    (label) => (
                      <TableHead
                        className="type-caption h-12 px-5"
                        key={label || "actions"}
                        scope="col"
                      >
                        {label || <span className="sr-only">Details</span>}
                      </TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((member) => (
                  <TableRow
                    className="border-border/40"
                    key={member.profiles.id}
                  >
                    <TableCell className="max-w-64 whitespace-normal px-5 py-4">
                      <p className="type-body-sm break-words">
                        {memberName(member)}
                      </p>
                      <p className="type-caption break-all text-muted-foreground">
                        {member.user?.email ?? "No email"}
                      </p>
                    </TableCell>
                    <TableCell className="type-body-sm whitespace-normal px-5">
                      {member.profiles.location?.trim() || "Not provided"}
                    </TableCell>
                    <TableCell className="type-body-sm px-5 tabular-nums">
                      {memberDate(member.profiles.birthday, true)}
                    </TableCell>
                    <TableCell className="type-body-sm px-5 tabular-nums">
                      {memberDate(member.profiles.createdAt)}
                    </TableCell>
                    <TableCell className="px-5">
                      <Button
                        aria-label={`View details for ${memberName(member)}`}
                        onClick={(event) => {
                          returnFocus.current = event.currentTarget;
                          update({ member: member.profiles.id });
                        }}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        View details
                        <ArrowRight aria-hidden="true" className="size-4">
                          <title>Open profile</title>
                        </ArrowRight>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="grid gap-3 md:hidden">
            {pageRows.map((member) => (
              <li
                className="flex min-w-0 flex-col gap-4 rounded-xl bg-card p-4"
                key={member.profiles.id}
              >
                <div>
                  <p className="type-body break-words">{memberName(member)}</p>
                  <p className="type-caption break-all text-muted-foreground">
                    {member.user?.email || "No email"}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="type-caption text-muted-foreground">
                      Location
                    </dt>
                    <dd className="type-body-sm break-words">
                      {member.profiles.location?.trim() || "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt className="type-caption text-muted-foreground">
                      Birthday
                    </dt>
                    <dd className="type-body-sm">
                      {memberDate(member.profiles.birthday, true)}
                    </dd>
                  </div>
                </dl>
                <Button
                  className="self-start"
                  onClick={(event) => {
                    returnFocus.current = event.currentTarget;
                    update({ member: member.profiles.id });
                  }}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  View details
                  <span className="sr-only"> for {memberName(member)}</span>
                  <ArrowRight aria-hidden="true" className="size-4">
                    <title>Open profile</title>
                  </ArrowRight>
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <QueryMessage>
          {records.length
            ? "No members match these filters. Try another search or clear the filters."
            : "No member profiles yet. Registrations will appear here."}
        </QueryMessage>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 border-border/40 border-t pt-4">
        <div className="w-28">
          <AdminSelect
            id="page-size"
            label="Rows per page"
            onChange={(pageSize) => update({ page: "", pageSize })}
            value={String(filters.pageSize)}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </AdminSelect>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="type-caption mr-2 text-muted-foreground">
            Page {page} of {pageCount}
          </p>
          <Button
            aria-label="Go to previous page"
            disabled={page === 1}
            onClick={() => update({ page: String(page - 1) })}
            size="sm"
            type="button"
            variant="secondary"
          >
            Previous
          </Button>
          <Button
            aria-label="Go to next page"
            disabled={page === pageCount}
            onClick={() => update({ page: String(page + 1) })}
            size="sm"
            type="button"
            variant="secondary"
          >
            Next
          </Button>
        </div>
      </div>
      <MemberDetails
        member={selected}
        onOpenChange={(open) => {
          if (!open) {
            update({ member: "" });
          }
        }}
        open={Boolean(memberId)}
        returnFocus={returnFocus}
      />
    </div>
  );
}
