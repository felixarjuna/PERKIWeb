"use client";

import { EyeOff, Globe, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import EditPrayerDialog from "~/components/prayer/edit-prayer-dialog";
import { Button } from "~/components/ui/button";
import { cn, timeAgo } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import {
  AdminSearch,
  AdminSegmented,
  AdminSelect,
  QueryMessage,
} from "../admin-controls";
import RecordActions from "../content/record-actions";

type Prayer = RouterOutputs["prayers"]["getPrayers"][number];

const ORDERS = [
  { label: "Newest first", value: "desc" },
  { label: "Oldest first", value: "asc" },
] as const;

function StatusChip({ published }: { published: boolean }) {
  const Icon = published ? Globe : Lock;
  return (
    <span
      className={cn(
        "type-caption inline-flex items-center gap-1 rounded-full px-2 py-1",
        published
          ? "bg-paper text-paper-foreground"
          : "bg-secondary text-secondary-foreground"
      )}
    >
      <Icon aria-hidden="true" className="size-3" />
      {published ? "Published" : "Private"}
    </span>
  );
}

function prayerMeta(prayer: Prayer) {
  const praying = Array.isArray(prayer.prayerNames)
    ? prayer.prayerNames.length
    : 0;
  return [
    prayer.isAnonymous ? "Anonymous" : prayer.name || "Unnamed",
    prayer.createdAt ? timeAgo(prayer.createdAt) : "",
    praying ? `${praying} praying` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function PrayerManager() {
  const query = api.prayers.getPrayers.useQuery();
  const utils = api.useUtils();
  const [q, setQ] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [order, setOrder] = useState("desc");
  const publish = api.prayers.setPrayerVisibility.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (_, input) => {
      await utils.prayers.invalidate();
      toast.success(
        input.visibility === "published"
          ? "Prayer published on the prayer wall."
          : "Prayer is private again."
      );
    },
  });
  const remove = api.prayers.deletePrayer.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.prayers.invalidate();
      toast.success("Prayer deleted.");
    },
  });
  const all = query.data ?? [];
  const privateCount = all.filter((p) => p.visibility !== "published").length;
  const records = all
    .filter(
      (prayer) =>
        prayer.content.toLowerCase().includes(q.trim().toLowerCase()) &&
        (visibility === "all" || visibility === prayer.visibility)
    )
    .sort(
      (a, b) =>
        ((a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0)) *
          (order === "desc" ? -1 : 1) || a.id - b.id
    );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <AdminSearch
          className="w-full sm:w-72"
          id="prayer-search"
          label="Search prayers"
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search prayer requests"
          value={q}
        />
        <AdminSegmented
          label="Visibility"
          onChange={setVisibility}
          options={[
            { label: "All", value: "all" },
            { label: `Private (${privateCount})`, value: "private" },
            { label: "Published", value: "published" },
          ]}
          value={visibility}
        />
        <AdminSelect
          className="w-40"
          hideLabel
          id="prayer-order"
          label="Sort by"
          onChange={setOrder}
          options={ORDERS}
          value={order}
        />
      </div>
      {query.isLoading ? <QueryMessage>Loading prayers…</QueryMessage> : null}
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
            {records.length} {records.length === 1 ? "request" : "requests"} ·
            Only published requests appear on the prayer wall
          </p>
          {records.length ? (
            <ul className="flex flex-col gap-3">
              {records.map((prayer) => {
                const published = prayer.visibility === "published";
                return (
                  <li
                    className="flex flex-col gap-3 rounded-xl bg-card p-4 sm:p-5"
                    key={prayer.id}
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <StatusChip published={published} />
                      <span className="type-caption text-muted-foreground">
                        {prayerMeta(prayer)}
                      </span>
                    </div>
                    <p className="type-body break-words">{prayer.content}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        disabled={publish.isPending}
                        onClick={() =>
                          publish.mutate({
                            id: prayer.id,
                            visibility: published ? "private" : "published",
                          })
                        }
                        size="sm"
                        type="button"
                        variant={published ? "secondary" : "default"}
                      >
                        {published ? (
                          <EyeOff aria-hidden="true" />
                        ) : (
                          <Globe aria-hidden="true" />
                        )}
                        {published ? "Make private" : "Publish"}
                      </Button>
                      <EditPrayerDialog prayer={prayer} />
                      <RecordActions
                        description="This permanently removes the prayer request, including who prayed for it."
                        name={prayer.content}
                        onDelete={() => remove.mutate({ id: prayer.id })}
                        pending={remove.isPending}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <QueryMessage>
              {all.length
                ? "No prayer requests match. Change the search or visibility filter."
                : "No prayer requests yet. New requests from the prayer wall appear here for review."}
            </QueryMessage>
          )}
        </>
      )}
    </div>
  );
}
