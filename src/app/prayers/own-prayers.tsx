"use client";

import { toast } from "sonner";
import RecordActions from "~/components/admin/content/record-actions";
import EditPrayerDialog from "~/components/prayer/edit-prayer-dialog";
import { Badge } from "~/components/ui/badge";
import { prayerBadgeStyles } from "~/lib/prayer-badge-styles";
import { timeAgo } from "~/lib/utils";
import { api } from "~/trpc/react";

/** The signed-in person's own requests, including ones waiting for review. */
export default function OwnPrayers() {
  const utils = api.useUtils();
  const query = api.prayers.getOwnPrayers.useQuery();
  const remove = api.prayers.deletePrayer.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.prayers.invalidate();
      toast.success("Prayer request deleted.");
    },
  });
  if (!query.data?.length) {
    return null;
  }
  return (
    <section aria-labelledby="own-prayers" className="flex flex-col gap-3">
      <h2 className="type-heading" id="own-prayers">
        Your requests
      </h2>
      <ul aria-labelledby="own-prayers" className="grid gap-3">
        {query.data.map((prayer) => {
          const published = prayer.visibility === "published";
          const { label, ...badge } = prayerBadgeStyles[prayer.visibility];
          return (
            <li
              className="flex flex-col gap-3 rounded-xl bg-card p-4 sm:p-6"
              key={prayer.id}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Badge size="status" {...badge}>
                  {published ? label : "Waiting for review"}
                </Badge>
                <span className="type-caption text-muted-foreground">
                  {[
                    prayer.isAnonymous ? "Anonymous" : "",
                    prayer.createdAt ? timeAgo(prayer.createdAt) : "",
                    published ? `${prayer.count} praying` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <p className="type-body break-words">{prayer.content}</p>
              <div className="flex flex-wrap items-center gap-2">
                <EditPrayerDialog
                  note={
                    published
                      ? "Edited requests go back to review before they're public again."
                      : "It stays private until it's reviewed."
                  }
                  prayer={prayer}
                />
                <RecordActions
                  description="This permanently removes your prayer request."
                  name={prayer.content}
                  onDelete={() => remove.mutate({ id: prayer.id })}
                  pending={remove.isPending}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
