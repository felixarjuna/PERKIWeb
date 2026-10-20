"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import AddPrayerForm from "~/app/prayers/add-prayer-form";
import EditPrayerDialog from "~/components/prayer/edit-prayer-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getUsernameFromName } from "~/lib/utils";
import { api } from "~/trpc/react";
import { AdminSelect, QueryMessage } from "../admin-controls";
import RecordActions from "../content/record-actions";

export default function PrayerManager() {
  const { data: session } = useSession();
  const query = api.prayers.getPrayers.useQuery();
  const utils = api.useUtils();
  const [q, setQ] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [order, setOrder] = useState("desc");
  const publish = api.prayers.setPrayerVisibility.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.prayers.invalidate();
      toast.success("Prayer visibility updated.");
    },
  });
  const remove = api.prayers.deletePrayer.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.prayers.invalidate();
      toast.success("Prayer deleted.");
    },
  });
  const records = (query.data ?? [])
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
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-4 rounded-xl bg-card p-5">
        <h2 className="type-subheading">Add a prayer request</h2>
        <p className="type-body-sm text-muted-foreground">
          Requests stay private until you review and publish them. Published
          requests can be read by everyone.
        </p>
        <AddPrayerForm
          username={getUsernameFromName(session?.user.name ?? "")}
        />
      </section>
      <div className="grid gap-4 rounded-xl bg-card p-5 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label
            className="type-caption text-muted-foreground"
            htmlFor="prayer-search"
          >
            Search prayers
          </Label>
          <Input
            className="h-11"
            id="prayer-search"
            onChange={(event) => setQ(event.target.value)}
            type="search"
            value={q}
          />
        </div>
        <AdminSelect
          id="prayer-visibility"
          label="Visibility"
          onChange={setVisibility}
          value={visibility}
        >
          <option value="all">All requests</option>
          <option value="private">Private</option>
          <option value="published">Published</option>
        </AdminSelect>
        <AdminSelect
          id="prayer-order"
          label="Sort by"
          onChange={setOrder}
          value={order}
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </AdminSelect>
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
            {records.length} requests
          </p>
          {records.length ? (
            <ul className="grid gap-3">
              {records.map((prayer) => (
                <li
                  className="flex flex-col gap-4 rounded-xl bg-card p-5"
                  key={prayer.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="type-caption rounded-full bg-secondary px-3 py-1">
                      {prayer.visibility === "published"
                        ? "Published · Public"
                        : "Private · Admin only"}
                    </span>
                    <span className="type-caption text-muted-foreground">
                      {prayer.isAnonymous
                        ? "Anonymous"
                        : prayer.name || "Unnamed"}
                    </span>
                  </div>
                  <p className="type-body break-words">{prayer.content}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      disabled={publish.isPending}
                      onClick={() =>
                        publish.mutate({
                          id: prayer.id,
                          visibility:
                            prayer.visibility === "published"
                              ? "private"
                              : "published",
                        })
                      }
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      {prayer.visibility === "published"
                        ? "Return to private"
                        : "Publish prayer"}
                    </Button>
                    <EditPrayerDialog prayer={prayer} />
                    <RecordActions
                      name={prayer.content}
                      onDelete={() => remove.mutate({ id: prayer.id })}
                      pending={remove.isPending}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <QueryMessage>
              No prayer requests match. Change the search or visibility filter.
            </QueryMessage>
          )}
        </>
      )}
    </div>
  );
}
