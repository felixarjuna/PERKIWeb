"use client";

import { DeleteButton } from "~/components/action-button";
import Navigation from "~/components/navigation";
import { Badge } from "~/components/ui/badge";
import { Toggle } from "~/components/ui/toggle";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/utils/api";
import AddPrayerForm from "./add-prayer-form";
import EditPrayerDialog from "./edit-prayer-dialog";

const username = "felixarjuna";

export default function Prayers() {
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
    <section className="min-h-screen bg-dark-green-default pb-40 text-cream-default">
      <Navigation showNav={true} />
      <div className="flex flex-col items-center px-10 pt-20 xs:px-12 xs:pt-20">
        <div className="flex max-w-5xl flex-col items-center justify-center gap-8 px-14 py-16 xs:w-full xs:px-0 xs:py-8">
          <h1 className="font-reimbrandt text-9xl xs:text-4xl">
            Pray together
          </h1>
          <div className="flex flex-col gap-y-2 text-2xl xs:text-base">
            <p>
              “Therefore, I tell you, whatever you ask in prayer, believe that
              you have received it, and it will be yours.”
            </p>
            <p>– Mark 11:24</p>
          </div>
        </div>

        <div className="mt-4 flex w-full max-w-5xl flex-col gap-y-4 px-14 xs:w-full xs:px-0">
          <h3 className="mb-8 font-reimbrandt text-2xl xs:mb-4 xs:text-base">
            Let&apos;s pray together every Wednesday at 18.30 a.m 😍
          </h3>

          <AddPrayerForm />
          <div className="space-y-4">
            <h2 className="font-reimbrandt text-3xl xs:text-xl">
              Prayer&apos;s list
            </h2>

            <div>
              <ul className="my-4 flex flex-col justify-center gap-2 xs:my-4 xs:gap-y-3">
                {prayers?.map((prayer, index) => {
                  return (
                    <li
                      className="relative flex justify-between gap-y-1 rounded-lg bg-green-default/80 p-6 text-sm xs:flex-col xs:p-4 xs:text-base"
                      key={index}
                    >
                      <p className="xs:px-2 xs:text-xs">{prayer.content}</p>

                      <div className="flex items-center gap-x-2 xs:justify-between">
                        <Badge variant={"secondary"} className="font-thin">
                          {prayer.isAnonymous ? "unknown" : prayer.name}
                        </Badge>

                        <div className="flex gap-x-2">
                          <Toggle
                            className="h-6 w-6 p-1"
                            pressed={prayer.prayerNames.includes(username)}
                            onPressedChange={(pressed) => {
                              if (pressed) {
                                updatePrayerCount.mutate({
                                  id: prayer.id,
                                  count: pressed
                                    ? prayer.count + 1
                                    : prayer.count - 1,
                                  prayerNames: [
                                    ...prayer.prayerNames,
                                    username,
                                  ],
                                });
                              } else {
                                updatePrayerCount.mutate({
                                  id: prayer.id,
                                  count: pressed
                                    ? prayer.count + 1
                                    : prayer.count - 1,
                                  prayerNames: prayer.prayerNames.filter(
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
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
