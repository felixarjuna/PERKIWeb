"use client";

import { CalendarDays, ListFilter } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React from "react";
import { AdminSearch } from "~/components/admin/admin-controls";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  filtersFrom,
  type GatheringFilters,
  NO_FILTERS,
  typeOf,
} from "~/lib/gathering-filters";
import { monthLabel } from "~/lib/months";

/** Radix selects can't hold "", so "any month" has its own value. */
const ANY_MONTH = "any";

const TYPES = [
  { label: "All gatherings", value: "all" },
  { label: "Church services", value: "church_service" },
  { label: "Bible studies", value: "bible_study" },
] as const;

/**
 * The filters, kept in `?q=`, `?type=` and `?month=` so a search can be
 * shared or reloaded. Writes replace the history entry, so typing doesn't
 * fill the back button.
 */
export function useGatheringFilters() {
  const params = useSearchParams();
  const [filters, setFilters] = React.useState(() => filtersFrom(params));
  const update = (next: GatheringFilters) => {
    setFilters(next);
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(next)) {
      if (value && value !== NO_FILTERS[key as keyof GatheringFilters]) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    }
    window.history.replaceState(null, "", url);
  };
  return [filters, update] as const;
}

/**
 * Why a filtered list is empty, e.g. “No Bible study takeaways match “grace”
 * in March 2026.”, with the one action that refills it.
 */
export function NoMatches({
  filters,
  noun,
  onClear,
}: {
  filters: GatheringFilters;
  /** Plural, lowercase, e.g. "takeaways". */
  noun: string;
  onClear: () => void;
}) {
  // Mid-sentence, so only "Bible" keeps its capital.
  const kind = {
    all: "",
    bible_study: "Bible study ",
    church_service: "church service ",
  }[filters.type];
  const q = filters.q.trim();
  const words = q ? ` match “${q}”` : "";
  const month = filters.month ? ` in ${monthLabel(filters.month)}` : "";
  return (
    <div className="rounded-xl bg-card p-4 sm:p-6">
      <p className="type-body text-muted-foreground">
        No {kind}
        {noun}
        {words}
        {month}.
      </p>
      <Button
        className="mt-3"
        onClick={onClear}
        size="sm"
        type="button"
        variant="secondary"
      >
        Clear filters
      </Button>
    </div>
  );
}

/** Search, gathering type and month, for /schedule and /takeaway. */
export default function GatheringFiltersBar({
  filters,
  onChange,
  months,
  label,
  placeholder,
}: {
  filters: GatheringFilters;
  onChange: (next: GatheringFilters) => void;
  /** `yyyy-MM` months that have something to show, newest first. */
  months: string[] | undefined;
  /** The search box's accessible name, e.g. "Search takeaways". */
  label: string;
  placeholder: string;
}) {
  // A month from a shared link stays selectable while the list loads.
  const monthOptions =
    filters.month && !months?.includes(filters.month)
      ? [filters.month, ...(months ?? [])]
      : (months ?? []);
  return (
    <search className="flex flex-col gap-3 sm:flex-row">
      <AdminSearch
        className="sm:flex-1"
        id="gathering-search"
        label={label}
        onChange={(event) => onChange({ ...filters, q: event.target.value })}
        placeholder={placeholder}
        value={filters.q}
      />
      <div className="grid grid-cols-2 gap-3 sm:flex">
        <Select
          onValueChange={(value) =>
            onChange({ ...filters, type: typeOf(value) })
          }
          value={filters.type}
        >
          <SelectTrigger
            aria-label="Gathering type"
            className="min-w-0 sm:w-44"
            variant="filter"
          >
            <span className="flex min-w-0 items-center gap-2">
              <ListFilter aria-hidden="true" className="size-3.5 shrink-0" />
              <SelectValue className="truncate" />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) =>
            onChange({ ...filters, month: value === ANY_MONTH ? "" : value })
          }
          value={filters.month || ANY_MONTH}
        >
          <SelectTrigger
            aria-label="Month"
            className="min-w-0 sm:w-44"
            variant="filter"
          >
            <span className="flex min-w-0 items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
              <SelectValue className="truncate" />
            </span>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectGroup>
              <SelectItem value={ANY_MONTH}>Any month</SelectItem>
              {monthOptions.map((month) => (
                <SelectItem key={month} value={month}>
                  {monthLabel(month)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </search>
  );
}
