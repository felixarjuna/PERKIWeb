"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { useState } from "react";
import { toast } from "sonner";
import LoadMore from "~/components/load-more";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { markdownToPlainText } from "~/lib/markdown";
import { api } from "~/trpc/react";
import { QueryMessage } from "../admin-controls";
import { type ContentFilters, takeawayQuery } from "./content-filters";
import ContentToolbar from "./content-toolbar";
import RecordActions from "./record-actions";

const PAGE_SIZE = 20;

export default function TakeawayManager() {
  const utils = api.useUtils();
  const [filters, setFilters] = useState<ContentFilters>({
    order: "desc",
    q: "",
    type: "all",
  });
  const input = takeawayQuery({ ...filters, q: useDebouncedValue(filters.q) });
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
      <ContentToolbar filters={filters} onChange={setFilters} />
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
            Changes appear on the public website immediately
          </p>
          {records.length ? (
            <ul className="grid gap-3">
              {records.map(
                ({ canManage, schedules: schedule, takeaways: note }) => (
                  <li
                    className="flex flex-col gap-4 rounded-xl bg-card p-5 lg:flex-row lg:items-start lg:gap-6"
                    key={note.id}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <p className="type-caption text-muted-foreground">
                        {schedule.type === "church_service"
                          ? "Church service"
                          : "Bible study"}{" "}
                        ·{" "}
                        {DateTime.fromJSDate(schedule.date)
                          .setZone("Europe/Berlin")
                          .toFormat("d LLL yyyy")}
                      </p>
                      <h2 className="type-subheading break-words">
                        {schedule.title}
                      </h2>
                      <p className="type-body-sm line-clamp-3 whitespace-pre-line break-words text-muted-foreground">
                        {markdownToPlainText(note.keypoints)}
                      </p>
                      <p className="type-caption text-muted-foreground">
                        {Array.isArray(note.contributors)
                          ? note.contributors.join(", ")
                          : "No contributors listed"}
                      </p>
                    </div>
                    {canManage ? (
                      <RecordActions
                        editUrl={`/admin/takeaways/${note.id}/edit`}
                        name={schedule.title}
                        onDelete={() => remove.mutate({ id: note.id })}
                        pending={remove.isPending}
                      />
                    ) : null}
                  </li>
                )
              )}
            </ul>
          ) : (
            <QueryMessage>
              No takeaways match. Try a different search or gathering type.
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
