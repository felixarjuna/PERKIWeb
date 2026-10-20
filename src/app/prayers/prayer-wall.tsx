"use client";

import { HandHeart } from "lucide-react";
import { toast } from "sonner";
import { DeleteButton } from "~/components/action-button";
import Loader from "~/components/loader";
import EditPrayerDialog from "~/components/prayer/edit-prayer-dialog";
import { Badge } from "~/components/ui/badge";
import { Toggle } from "~/components/ui/toggle";
import { api } from "~/trpc/react";
import AddPrayerForm from "./add-prayer-form";

export default function PrayerWall() {
  const utils = api.useUtils();
  const { data: prayers } = api.prayers.getPrayers.useQuery();

  const setPrayed = api.prayers.setPrayed.useMutation({
    onSuccess: () => utils.prayers.invalidate(),
  });

  const deletePrayer = api.prayers.deletePrayer.useMutation({
    onSuccess: async () => {
      await utils.prayers.invalidate();
      toast.success("Prayer successfully deleted!", {
        description: "Don't be shy, it's okay!",
      });
    },
  });

  function renderPrayers() {
    if (prayers === undefined) {
      return (
        <li>
          <Loader className="mt-4" message="Loading prayers ..." />
        </li>
      );
    }

    if (prayers.length === 0) {
      return (
        <li className="type-body rounded-xl bg-card p-4 text-muted-foreground sm:p-6">
          No prayer requests yet. Share a request above so others can pray with
          you.
        </li>
      );
    }

    return prayers.map((prayer) => (
      <li
        className="relative flex flex-col gap-y-2 rounded-xl bg-card p-4 sm:p-6"
        key={prayer.id}
      >
        <Badge className="type-caption w-fit" variant={"secondary"}>
          {prayer.isAnonymous ? "unknown" : prayer.name}
        </Badge>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="type-body min-w-0 flex-1">{prayer.content}</p>

          <div className="flex shrink-0 gap-2 self-end">
            <Toggle
              aria-label="Pray for this request"
              className="size-10"
              onPressedChange={(pressed) =>
                setPrayed.mutate({ id: prayer.id, prayed: pressed })
              }
              pressed={prayer.prayedByMe}
            >
              <HandHeart aria-hidden="true" className="size-4" />
            </Toggle>

            {prayer.canManage ? (
              <div className="flex gap-x-2">
                <EditPrayerDialog prayer={prayer} />

                <DeleteButton
                  onDeleteClick={() => deletePrayer.mutate({ id: prayer.id })}
                />
              </div>
            ) : null}
          </div>
        </div>

        <Badge
          className="type-caption absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full px-0 py-0 tabular-nums"
          variant={"secondary"}
        >
          {prayer.count}
        </Badge>
      </li>
    ));
  }

  return (
    <div className="flex w-full flex-col gap-y-4">
      <p className="type-body mb-2">
        Share a prayer request and pray for one another.
      </p>

      <AddPrayerForm />

      <div className="space-y-4">
        <h2 className="type-heading">Prayer requests</h2>

        <div>
          <ul className="my-4 flex flex-col justify-center gap-2 gap-y-3">
            {renderPrayers()}
          </ul>
        </div>
      </div>
    </div>
  );
}
