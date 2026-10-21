"use client";

import { X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { AdminSearch, AdminSelect } from "../admin-controls";
import type { ContentFilters } from "./content-filters";

const TYPES = [
  { label: "All gatherings", value: "all" },
  { label: "Church service", value: "church_service" },
  { label: "Bible study", value: "bible_study" },
] as const;
const PERIODS = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" },
  { label: "All dates", value: "all" },
] as const;
const ORDERS = [
  { label: "Earliest first", value: "asc" },
  { label: "Latest first", value: "desc" },
] as const;

export default function ContentToolbar({
  filters,
  onChange,
  schedules = false,
}: {
  filters: ContentFilters;
  onChange: (value: ContentFilters) => void;
  schedules?: boolean;
}) {
  const defaults: ContentFilters = {
    order: schedules ? "asc" : "desc",
    period: "all",
    q: "",
    type: "all",
  };
  const isFiltered =
    filters.q !== defaults.q ||
    filters.type !== defaults.type ||
    filters.order !== defaults.order ||
    (schedules && (filters.period ?? "all") !== defaults.period);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <AdminSearch
        className="w-full sm:w-72"
        id="content-search"
        label={`Search ${schedules ? "schedules" : "takeaways"}`}
        onChange={(event) => onChange({ ...filters, q: event.target.value })}
        placeholder={
          schedules
            ? "Search title, passage or name"
            : "Search title or takeaway"
        }
        value={filters.q}
      />
      <AdminSelect
        className="w-[calc(50%-0.25rem)] sm:w-44"
        hideLabel
        id="content-type"
        label="Gathering type"
        onChange={(type) => onChange({ ...filters, type })}
        options={TYPES}
        value={filters.type}
      />
      {schedules ? (
        <AdminSelect
          className="w-[calc(50%-0.25rem)] sm:w-36"
          hideLabel
          id="content-period"
          label="Time period"
          onChange={(period) => onChange({ ...filters, period })}
          options={PERIODS}
          value={filters.period ?? "all"}
        />
      ) : null}
      <AdminSelect
        className="w-[calc(50%-0.25rem)] sm:w-40"
        hideLabel
        id="content-order"
        label="Event date"
        onChange={(order) => onChange({ ...filters, order })}
        options={ORDERS}
        value={filters.order}
      />
      {isFiltered ? (
        <Button
          className="h-10"
          onClick={() => onChange(defaults)}
          size="sm"
          type="button"
          variant="ghost"
        >
          Reset
          <X aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
