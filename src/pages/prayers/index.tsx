"use client";

import { type GetServerSidePropsContext } from "next";
import { getSession, useSession } from "next-auth/react";
import React from "react";
import { DeleteButton } from "~/components/action-button";
import Loader from "~/components/loader";
import Template from "~/components/template";
import { Badge } from "~/components/ui/badge";
import { Toggle } from "~/components/ui/toggle";
import { useToast } from "~/components/ui/use-toast";
import { getUsernameFromName } from "~/lib/utils";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";
import EditPrayerDialog from "../../components/prayer/edit-prayer-dialog";
import AddPrayerForm from "./add-prayer-form";

export default function Prayers() {
  const { data: session } = useSession();
  const username = React.useMemo(
    () => getUsernameFromName(session?.user.name ?? ""),
    [session?.user.name],
  );

  const { toast } = useToast();
  const utils = api.useContext();
  const { data: prayers } = api.prayers.getPrayers.useQuery();

  const updatePrayerCount = api.prayers.updatePrayerCount.useMutation({
    onSuccess: () => utils.prayers.invalidate(),
  });

  const deletePrayer = api.prayers.deletePrayer.useMutation({
    onSuccess: async () => {
      await utils.prayers.invalidate();
      toast({
        title: "Prayer successfully deleted! 😥",
        description: "Don't be shy, it's okay!",
      });
    },
  });

  return (
    <Template
      title="Prayers"
      subtitle={
        <div className="flex flex-col gap-y-2 text-base sm:px-14 sm:text-2xl">
          <p>
            “Therefore, I tell you, whatever you ask in prayer, believe that you
            have received it, and it will be yours.”
          </p>
          <p>– Mark 11:24</p>
        </div>
      }
    >
      <div className="mt-8 flex w-full flex-col gap-y-4 px-0 sm:w-full sm:px-14">
        <h3 className="mb-4 font-reimbrandt text-base sm:mb-8 sm:text-2xl">
          Let&apos;s pray together every Wednesday at 18.30 a.m 😍
        </h3>

        <AddPrayerForm />

        <div className="space-y-4">
          <h2 className="font-reimbrandt text-xl sm:text-3xl">
            Prayer&apos;s list
          </h2>

          <div>
            <ul className="my-4 flex flex-col justify-center gap-2 gap-y-3">
              {prayers === undefined ? (
                <Loader message="Loading prayers ..." className="mt-4" />
              ) : prayers.length === 0 ? (
                <div className="mt-4 text-center">No prayer found.</div>
              ) : (
                prayers?.map((prayer, index) => {
                  const names = prayer.prayerNames as string[];
                  return (
                    <li
                      className="items relative flex flex-col gap-y-1 rounded-lg bg-green-default/80 px-4 py-2 text-base sm:p-6 sm:text-sm"
                      key={index}
                    >
                      <Badge
                        variant={"secondary"}
                        className="w-fit text-xs font-thin"
                      >
                        {prayer.isAnonymous ? "unknown" : prayer.name}
                      </Badge>

                      <div className="flex items-center justify-between gap-x-2">
                        <p className="text-xs">{prayer.content}</p>

                        <div className="flex gap-x-2">
                          <Toggle
                            className="h-6 w-6 p-1"
                            pressed={names.includes(username)}
                            onPressedChange={(pressed) => {
                              if (pressed) {
                                updatePrayerCount.mutate({
                                  id: prayer.id,
                                  count: pressed
                                    ? prayer.count + 1
                                    : prayer.count - 1,
                                  prayerNames: [...names, username],
                                });
                              } else {
                                updatePrayerCount.mutate({
                                  id: prayer.id,
                                  count: pressed
                                    ? prayer.count + 1
                                    : prayer.count - 1,
                                  prayerNames: names.filter(
                                    (name) => !name.includes(username),
                                  ),
                                });
                              }
                            }}
                          >
                            🙏
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
                        variant={"secondary"}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-green-default px-0 py-0 text-[0.6rem] font-thin"
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
    </Template>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: authOptions.pages?.signIn,
        permanent: false,
      },
    };
  }

  return { props: { session } };
}
