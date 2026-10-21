"use client";

import { DateTime } from "luxon";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { AdminSegmented, QueryMessage } from "../admin-controls";
import { type ContentFilters, filterSchedules } from "./content-filters";
import ContentToolbar from "./content-toolbar";
import RecordActions from "./record-actions";
import ScheduleCalendar, { monthOf } from "./schedule-calendar";

const VIEWS = [
  { label: "List", value: "list" },
  { label: "Calendar", value: "calendar" },
] as const;

/** Keeps the view and month in the URL, so back and reload land on the same month. */
function updateUrl(values: Record<string, string | null>) {
  const next = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(values)) {
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
  }
  const query = next.toString();
  window.history.pushState(
    null,
    "",
    query ? `/admin/schedules?${query}` : "/admin/schedules"
  );
}

export default function ScheduleManager() {
  const params = useSearchParams();
  const view = params.get("view") === "calendar" ? "calendar" : "list";
  const query = api.schedules.getSchedules.useQuery();
  const utils = api.useUtils();
  const [filters, setFilters] = useState<ContentFilters>({
    order: "asc",
    period: "upcoming",
    q: "",
    type: "all",
  });
  const remove = api.schedules.deleteSchedule.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.schedules.invalidate();
      toast.success("Schedule deleted.");
    },
  });
  const records = filterSchedules(query.data ?? [], filters, new Date());
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <AdminSegmented
          label="View"
          onChange={(next) =>
            updateUrl({
              month: null,
              view: next === "calendar" ? "calendar" : null,
            })
          }
          options={VIEWS}
          value={view}
        />
      </div>
      {view === "list" ? (
        <ContentToolbar filters={filters} onChange={setFilters} schedules />
      ) : null}
      {query.isLoading ? <QueryMessage>Loading schedules…</QueryMessage> : null}
      {query.isError ? (
        <QueryMessage
          error
          onRetry={() => {
            query.refetch();
          }}
        />
      ) : null}
      {!(query.isLoading || query.isError) && view === "calendar" ? (
        <ScheduleCalendar
          month={params.get("month") ?? monthOf(new Date())}
          onMonthChange={(month) => updateUrl({ month })}
          schedules={query.data ?? []}
        />
      ) : null}
      {query.isLoading || query.isError || view === "calendar" ? null : (
        <>
          <p aria-live="polite" className="type-caption text-muted-foreground">
            {records.length} schedules · Changes appear on the public website
            immediately
          </p>
          {records.length ? (
            <ul className="flex flex-col gap-3">
              {records.map((record) => (
                <li
                  className="flex flex-col gap-4 rounded-xl bg-card p-5 lg:flex-row lg:items-center lg:gap-6"
                  key={record.id}
                >
                  <div className="flex w-fit shrink-0 flex-col rounded-lg bg-secondary px-4 py-3 text-center lg:w-20">
                    <span className="type-subheading tabular-nums">
                      {DateTime.fromJSDate(record.date)
                        .setZone("Europe/Berlin")
                        .toFormat("dd")}
                    </span>
                    <span className="type-caption text-muted-foreground">
                      {DateTime.fromJSDate(record.date)
                        .setZone("Europe/Berlin")
                        .toFormat("LLL yyyy")}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className="type-caption text-muted-foreground">
                      {record.type === "church_service"
                        ? "Church service"
                        : "Bible study"}{" "}
                      ·{" "}
                      {DateTime.fromJSDate(record.date)
                        .setZone("Europe/Berlin")
                        .toFormat("HH:mm")}
                    </p>
                    <h2 className="type-subheading break-words">
                      {record.title}
                    </h2>
                    <p className="type-body-sm text-muted-foreground">
                      {record.preacher || record.leader} · {record.bibleVerse}
                    </p>
                    <p className="type-body-sm line-clamp-2 break-words text-muted-foreground">
                      {record.description}
                    </p>
                  </div>
                  <RecordActions
                    description="This permanently deletes the schedule and every takeaway written for it. This cannot be undone."
                    editUrl={`/admin/schedules/${record.id}/edit`}
                    name={record.title}
                    onDelete={() => remove.mutate({ id: record.id })}
                    pending={remove.isPending}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <QueryMessage>
              No schedules match. Change the time period or reset the filters to
              see more.
            </QueryMessage>
          )}
        </>
      )}
    </div>
  );
}
