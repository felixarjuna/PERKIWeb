"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { DateTime } from "luxon";
import Link from "next/link";
import { useState } from "react";
import LoadMore from "~/components/load-more";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { TAKEAWAY_STATUSES, type TakeawayStatus } from "~/lib/db/schema/schema";
import { takeawayBadgeStyles } from "~/lib/takeaway-badge-styles";
import { statusLabels } from "~/lib/takeaway-status";
import { api } from "~/trpc/react";
import { AdminSelect, QueryMessage } from "../admin-controls";
import { type ContentFilters, takeawayQuery } from "./content-filters";
import ContentToolbar from "./content-toolbar";
import { TakeawayActions } from "./takeaway-actions";

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
                  actions,
                  canManage,
                  schedules: schedule,
                  takeaways: note,
                }) => (
                  <li key={note.id}>
                    <Card className="relative hover:bg-accent/40">
                      <CardHeader className="gap-2 p-5 pb-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="type-caption min-w-0 text-muted-foreground">
                            {schedule.type === "church_service"
                              ? "Church service"
                              : "Bible study"}{" "}
                            ·{" "}
                            {DateTime.fromJSDate(schedule.date)
                              .setZone("Europe/Berlin")
                              .toFormat("d LLL yyyy")}
                          </p>
                          <Badge
                            data-slot="takeaway-status"
                            size="status"
                            {...takeawayBadgeStyles[note.status]}
                          >
                            {statusLabels[note.status]}
                          </Badge>
                        </div>
                        <CardTitle>
                          <h2 className="type-subheading break-words">
                            <Link
                              aria-label={`${canManage ? "Edit" : "Review"} ${schedule.title}`}
                              className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background"
                              href={
                                canManage
                                  ? `/admin/takeaways/${note.id}/edit`
                                  : `/admin/takeaways/${note.id}`
                              }
                            >
                              {schedule.title}
                            </Link>
                          </h2>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2 p-5 pt-2">
                        <CardDescription>
                          <p className="type-body-sm line-clamp-3 whitespace-pre-line break-words text-muted-foreground">
                            {note.preview}
                          </p>
                        </CardDescription>
                        <p className="type-caption text-muted-foreground">
                          {Array.isArray(note.contributors)
                            ? note.contributors.join(", ")
                            : "No contributors listed"}
                        </p>
                      </CardContent>
                      <CardFooter className="px-5 pb-5">
                        <TakeawayActions
                          actions={actions}
                          canManage={canManage}
                          id={note.id}
                          name={schedule.title}
                          status={note.status}
                        />
                      </CardFooter>
                    </Card>
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
