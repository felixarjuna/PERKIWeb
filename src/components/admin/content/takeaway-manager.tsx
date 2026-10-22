"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { DateTime } from "luxon";
import Link from "next/link";
import { useState } from "react";
import LoadMore from "~/components/load-more";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { TAKEAWAY_STATUSES, type TakeawayStatus } from "~/lib/db/schema/schema";
import { statusLabels } from "~/lib/takeaway-status";
import { api } from "~/trpc/react";
import { AdminSelect, QueryMessage } from "../admin-controls";
import { type ContentFilters, takeawayQuery } from "./content-filters";
import ContentToolbar from "./content-toolbar";
import { TakeawayActions } from "./takeaway-actions";
import { TakeawayStatusBadge } from "./takeaway-status-badge";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  ...TAKEAWAY_STATUSES.map((status) => ({
    label: statusLabels[status],
    value: status,
  })),
] as const;

const isStatus = (value: string): value is TakeawayStatus =>
  TAKEAWAY_STATUSES.some((status) => status === value);

export default function TakeawayManager() {
  const [filters, setFilters] = useState<ContentFilters>({
    order: "desc",
    q: "",
    type: "all",
  });
  const [status, setStatus] = useState<TakeawayStatus | "all">("all");
  const input = {
    ...takeawayQuery({ ...filters, q: useDebouncedValue(filters.q) }),
    status,
  };
  const query = api.takeaways.getManageable.useInfiniteQuery(
    { ...input, limit: PAGE_SIZE },
    {
      getNextPageParam: (page) => page.nextCursor,
      placeholderData: keepPreviousData,
    }
  );
  const records = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <div className="flex flex-col gap-5">
      <ContentToolbar filters={filters} onChange={setFilters}>
        <AdminSelect
          className="w-[calc(50%-0.25rem)] sm:w-40"
          hideLabel
          id="content-status"
          label="Status"
          onChange={(next) => setStatus(isStatus(next) ? next : "all")}
          options={STATUS_OPTIONS}
          value={status}
        />
      </ContentToolbar>
      {query.isLoading ? <QueryMessage>Loading takeaways…</QueryMessage> : null}
      {query.isError ? (
        <QueryMessage
          error
          onRetry={() => {
            query.refetch();
          }}
        />
      ) : null}
      {query.isLoading || query.isError ? null : (
        <>
          <p aria-live="polite" className="type-caption text-muted-foreground">
            {records.length} takeaways{query.hasNextPage ? " so far" : ""} ·
            Only published takeaways appear on the website
          </p>
          {records.length ? (
            <ul className="grid gap-3">
              {records.map(
                ({
                  canManage,
                  canPublish,
                  schedules: schedule,
                  takeaways: note,
                }) => (
                  <li
                    className="relative flex flex-col gap-4 rounded-xl bg-card p-5 hover:bg-accent/40 lg:flex-row lg:items-start lg:gap-6"
                    key={note.id}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <TakeawayStatusBadge value={note.status} />
                        <p className="type-caption text-muted-foreground">
                          {schedule.type === "church_service"
                            ? "Church service"
                            : "Bible study"}{" "}
                          ·{" "}
                          {DateTime.fromJSDate(schedule.date)
                            .setZone("Europe/Berlin")
                            .toFormat("d LLL yyyy")}
                        </p>
                      </div>
                      <h2 className="type-subheading break-words">
                        <Link
                          aria-label={`Read ${schedule.title}`}
                          className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background"
                          href={`/takeaway/${note.id}`}
                        >
                          {schedule.title}
                        </Link>
                      </h2>
                      <p className="type-body-sm line-clamp-3 whitespace-pre-line break-words text-muted-foreground">
                        {note.preview}
                      </p>
                      <p className="type-caption text-muted-foreground">
                        {Array.isArray(note.contributors)
                          ? note.contributors.join(", ")
                          : "No contributors listed"}
                      </p>
                    </div>
                    <TakeawayActions
                      id={note.id}
                      name={schedule.title}
                      rights={{ canManage, canPublish }}
                      status={note.status}
                    />
                  </li>
                )
              )}
            </ul>
          ) : (
            <QueryMessage>
              No takeaways match. Try a different search, type or status.
            </QueryMessage>
          )}
          <LoadMore
            count={records.length}
            hasNextPage={query.hasNextPage && !query.isPlaceholderData}
            key={JSON.stringify(input)}
            loading={query.isFetching}
            noun="takeaways"
            onLoadMore={() => {
              query.fetchNextPage();
            }}
          />
        </>
      )}
    </div>
  );
}
