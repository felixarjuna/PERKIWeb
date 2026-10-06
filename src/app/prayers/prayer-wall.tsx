"use client";

import { HandHeart } from "lucide-react";
import { useSession } from "next-auth/react";
import React from "react";
import { toast } from "sonner";
import { DeleteButton } from "~/components/action-button";
import Loader from "~/components/loader";
import EditPrayerDialog from "~/components/prayer/edit-prayer-dialog";
import { Badge } from "~/components/ui/badge";
import { Toggle } from "~/components/ui/toggle";
import { getUsernameFromName } from "~/lib/utils";
import { api } from "~/trpc/react";
import AddPrayerForm from "./add-prayer-form";

export default function PrayerWall() {
  const { data: session } = useSession();
  const username = React.useMemo(
    () => getUsernameFromName(session?.user.name ?? ""),
    [session?.user.name]
  );

  const utils = api.useUtils();
  const { data: prayers } = api.prayers.getPrayers.useQuery();

  const updatePrayerCount = api.prayers.updatePrayerCount.useMutation({
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

  return (
    <div className="flex w-full flex-col gap-y-4">
      <p className="mb-2 text-sm sm:text-base">
        Let&apos;s pray together every Wednesday at 18.30 a.m
      </p>

      <AddPrayerForm />

      <div className="space-y-4">
        <h2 className="font-reimbrandt text-2xl tracking-wide sm:text-3xl">
          Prayer&apos;s list
        </h2>

        <div>
          <ul className="my-4 flex flex-col justify-center gap-2 gap-y-3">
            {prayers === undefined ? (
              <Loader className="mt-4" message="Loading prayers ..." />
            ) : prayers.length === 0 ? (
              <div className="mt-4 text-center">No prayer found.</div>
            ) : (
              prayers.map((prayer) => {
                const names = prayer.prayerNames as string[];
                const hasPrayed = names.includes(username);
                return (
                  <li
                    className="relative flex flex-col gap-y-2 rounded-xl bg-card p-4 sm:p-6"
                    key={prayer.id}
                  >
                    <Badge
                      className="w-fit font-thin text-xs"
                      variant={"secondary"}
                    >
                      {prayer.isAnonymous ? "unknown" : prayer.name}
                    </Badge>

                    <div className="flex items-center justify-between gap-x-2">
                      <p className="text-sm">{prayer.content}</p>

                      <div className="flex gap-x-2">
                        <Toggle
                          className="h-6 w-6 p-1"
                          onPressedChange={(pressed) => {
                            updatePrayerCount.mutate({
                              count: pressed
                                ? prayer.count + 1
                                : prayer.count - 1,
                              id: prayer.id,
                              prayerNames: pressed
                                ? [...names, username]
                                : names.filter(
                                    (name) => !name.includes(username)
                                  ),
                            });
                          }}
                          pressed={hasPrayed}
                        >
                          <HandHeart className="size-4" />
                        </Toggle>

                        {username === prayer.name ? (
                          <div className="flex gap-x-2">
                            <EditPrayerDialog prayer={prayer} />

                            <DeleteButton
                              onDeleteClick={() =>
                                deletePrayer.mutate({ id: prayer.id })
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <Badge
                      className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border-accent px-0 py-0 font-thin text-[0.6rem]"
                      variant={"secondary"}
                    >
                      {prayer.count}
                    </Badge>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
