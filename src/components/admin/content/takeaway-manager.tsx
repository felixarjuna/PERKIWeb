"use client";

import { DateTime } from "luxon";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { QueryMessage } from "../admin-controls";
import { type ContentFilters, filterTakeaways } from "./content-filters";
import ContentToolbar from "./content-toolbar";
import RecordActions from "./record-actions";

export default function TakeawayManager() {
  const query = api.takeaways.getManageable.useQuery();
  const utils = api.useUtils();
  const [filters, setFilters] = useState<ContentFilters>({
    order: "desc",
    q: "",
    type: "all",
  });
  const remove = api.takeaways.deleteTakeaway.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.takeaways.invalidate();
      toast.success("Takeaway deleted.");
    },
  });
  const records = filterTakeaways(query.data ?? [], filters);
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
            {records.length} takeaways · Changes appear on the public website
            immediately
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
                      <p className="type-body-sm line-clamp-3 whitespace-pre-wrap break-words text-muted-foreground">
                        {note.keypoints}
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
        </>
      )}
    </div>
  );
}
