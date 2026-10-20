"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { AdminSelect } from "../admin-controls";
import type { ContentFilters } from "./content-filters";

export default function ContentToolbar({
  filters,
  onChange,
  schedules = false,
}: {
  filters: ContentFilters;
  onChange: (value: ContentFilters) => void;
  schedules?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label
            className="type-caption text-muted-foreground"
            htmlFor="content-search"
          >
            Search {schedules ? "schedules" : "takeaways"}
          </Label>
          <Input
            className="h-11"
            id="content-search"
            onChange={(event) =>
              onChange({ ...filters, q: event.target.value })
            }
            placeholder={
              schedules ? "Title or speaker" : "Title or takeaway text"
            }
            type="search"
            value={filters.q}
          />
        </div>
        <AdminSelect
          id="content-type"
          label="Gathering type"
          onChange={(type) => onChange({ ...filters, type })}
          value={filters.type}
        >
          <option value="all">All gatherings</option>
          <option value="church_service">Church service</option>
          <option value="bible_study">Bible study</option>
        </AdminSelect>
        {schedules ? (
          <AdminSelect
            id="content-period"
            label="Time period"
            onChange={(period) => onChange({ ...filters, period })}
            value={filters.period ?? "all"}
          >
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="all">All dates</option>
          </AdminSelect>
        ) : null}
        <AdminSelect
          id="content-order"
          label="Event date"
          onChange={(order) => onChange({ ...filters, order })}
          value={filters.order}
        >
          <option value="asc">Earliest first</option>
          <option value="desc">Latest first</option>
        </AdminSelect>
      </div>
      <Button
        className="self-start"
        onClick={() =>
          onChange({
            order: schedules ? "asc" : "desc",
            period: "all",
            q: "",
            type: "all",
          })
        }
        size="sm"
        type="button"
        variant="ghost"
      >
        Reset filters
      </Button>
    </div>
  );
}
