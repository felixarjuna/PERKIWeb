"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { CalendarDays, List } from "lucide-react";
import { DateTime } from "luxon";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import LoadMore from "~/components/load-more";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { monthOf, monthRange } from "~/lib/months";
import { api, type RouterOutputs } from "~/trpc/react";
import { AdminSegmented, QueryMessage } from "../admin-controls";
import { type ContentFilters, scheduleQuery } from "./content-filters";
import ContentToolbar from "./content-toolbar";
import RecordActions from "./record-actions";
import ScheduleCalendar from "./schedule-calendar";

const VIEWS = [
  { icon: List, label: "List", value: "list" },
  { icon: CalendarDays, label: "Calendar", value: "calendar" },
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

const ZONE = "Europe/Berlin";

const PAGE_SIZE = 20;

type ScheduleRecord = RouterOutputs["schedules"]["list"]["items"][number];

/**
 * One schedule: the date beside the details on every screen size, actions at
 * the end.
 */
function ScheduleRow({
  record,
  onDelete,
  pending,
}: {
  record: ScheduleRecord;
  onDelete: () => void;
  pending: boolean;
}) {
  const date = DateTime.fromJSDate(record.date).setZone(ZONE);
  const thisYear = date.hasSame(DateTime.now().setZone(ZONE), "year");
  const meta = [record.preacher || record.leader, record.bibleVerse]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="flex gap-4 rounded-xl bg-card p-4 sm:p-5">
      <div className="flex w-14 shrink-0 flex-col items-center self-start rounded-lg bg-secondary py-2">
        <span className="type-caption text-muted-foreground">
          {date.toFormat("LLL")}
        </span>
        <span className="type-subheading tabular-nums">{date.day}</span>
        <span className="type-caption text-muted-foreground">
          {thisYear ? date.toFormat("ccc") : date.year}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="type-caption text-muted-foreground">
            {record.type === "church_service"
              ? "Church service"
              : "Bible study"}{" "}
            · {date.toFormat("HH:mm")}
          </p>
          <h2 className="type-subheading break-words">{record.title}</h2>
          {meta ? (
            <p className="type-body-sm text-muted-foreground">{meta}</p>
          ) : null}
          {record.description ? (
            <p className="type-body-sm line-clamp-2 break-words text-muted-foreground">
              {record.description}
            </p>
          ) : null}
        </div>
        <RecordActions
          description="This permanently deletes the schedule and every takeaway written for it. This cannot be undone."
          editUrl={`/admin/schedules/${record.id}/edit`}
          name={record.title}
          onDelete={onDelete}
          pending={pending}
        />
      </div>
    </li>
  );
}

export default function ScheduleManager() {
  const params = useSearchParams();
  const view = params.get("view") === "calendar" ? "calendar" : "list";
  const month = params.get("month") ?? monthOf(new Date());
  const utils = api.useUtils();
  const [filters, setFilters] = useState<ContentFilters>({
    order: "asc",
    period: "upcoming",
    q: "",
    type: "all",
  });
  // Fixed per visit, so "upcoming" and "past" keep a stable cache key.
  const [now] = useState(() => new Date());
  const input = scheduleQuery(
    { ...filters, q: useDebouncedValue(filters.q) },
    now
  );
  const list = api.schedules.list.useInfiniteQuery(
    { ...input, limit: PAGE_SIZE },
    {
      enabled: view === "list",
      getNextPageParam: (page) => page.nextCursor,
      placeholderData: keepPreviousData,
    }
  );
  const calendar = api.schedules.inRange.useQuery(monthRange(month), {
    enabled: view === "calendar",
    placeholderData: keepPreviousData,
  });
  const query = view === "calendar" ? calendar : list;
  const remove = api.schedules.deleteSchedule.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.schedules.invalidate();
      toast.success("Schedule deleted.");
    },
  });
  const records = list.data?.pages.flatMap((page) => page.items) ?? [];
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
          month={month}
          onMonthChange={(next) => updateUrl({ month: next })}
          schedules={calendar.data ?? []}
        />
      ) : null}
      {query.isLoading || query.isError || view === "calendar" ? null : (
        <>
          <p aria-live="polite" className="type-caption text-muted-foreground">
            {records.length} schedules{list.hasNextPage ? " so far" : ""} ·
            Changes appear on the public website immediately
          </p>
          {records.length ? (
            <ul className="flex flex-col gap-3">
              {records.map((record) => (
                <ScheduleRow
                  key={record.id}
                  onDelete={() => remove.mutate({ id: record.id })}
                  pending={remove.isPending}
                  record={record}
                />
              ))}
            </ul>
          ) : (
            <QueryMessage>
              No schedules match. Change the time period or reset the filters to
              see more.
            </QueryMessage>
          )}
          <LoadMore
            count={records.length}
            hasNextPage={list.hasNextPage && !list.isPlaceholderData}
            key={JSON.stringify(input)}
            loading={list.isFetching}
            noun="schedules"
            onLoadMore={() => {
              list.fetchNextPage();
            }}
          />
        </>
      )}
    </div>
  );
}
