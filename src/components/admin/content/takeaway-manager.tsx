"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { DateTime } from "luxon";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import LoadMore from "~/components/load-more";
import { Button, buttonVariants } from "~/components/ui/button";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { TAKEAWAY_STATUSES, type TakeawayStatus } from "~/lib/db/schema/schema";
import { statusActions, statusLabels } from "~/lib/takeaway-status";
import { api } from "~/trpc/react";
import { AdminSelect, QueryMessage } from "../admin-controls";
import { type ContentFilters, takeawayQuery } from "./content-filters";
import ContentToolbar from "./content-toolbar";
import RecordActions from "./record-actions";
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

const toastFor: Record<TakeawayStatus, string> = {
  draft: "Takeaway sent back to draft.",
  in_review: "Takeaway sent to review.",
  published: "Takeaway published. It is now on the website.",
};

/** The status buttons of one row, if the viewer may change its status. */
function StatusActions({
  id,
  name,
  rights,
  status,
}: {
  id: number;
  name: string;
  rights: { canManage: boolean; canPublish: boolean };
  status: TakeawayStatus;
}) {
  const utils = api.useUtils();
  const setStatus = api.takeaways.setStatus.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (row) => {
      await utils.takeaways.invalidate();
      toast.success(toastFor[row.status]);
    },
  });
  const actions = statusActions(status, rights);
  if (actions.length === 0) {
    return null;
  }
  return (
    <>
      {actions.map((action) => (
        <Button
          aria-label={`${action.label}: ${name}`}
          disabled={setStatus.isPending}
          key={action.to}
          onClick={() => setStatus.mutate({ id, status: action.to })}
          size="sm"
          type="button"
          variant={action.primary ? "default" : "secondary"}
        >
          {action.label}
        </Button>
      ))}
    </>
  );
}

export default function TakeawayManager() {
  const utils = api.useUtils();
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
  const remove = api.takeaways.deleteTakeaway.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.takeaways.invalidate();
      toast.success("Takeaway deleted.");
    },
  });
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
                    className="flex flex-col gap-4 rounded-xl bg-card p-5 lg:flex-row lg:items-start lg:gap-6"
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
                        {schedule.title}
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
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        aria-label={`Read ${schedule.title}`}
                        className={buttonVariants({ variant: "secondary" })}
                        href={`/takeaway/${note.id}`}
                      >
                        Read
                      </Link>
                      <StatusActions
                        id={note.id}
                        name={schedule.title}
                        rights={{ canManage, canPublish }}
                        status={note.status}
                      />
                      {canManage ? (
                        <RecordActions
                          editUrl={`/admin/takeaways/${note.id}/edit`}
                          name={schedule.title}
                          onDelete={() => remove.mutate({ id: note.id })}
                          pending={remove.isPending}
                        />
                      ) : null}
                    </div>
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
