"use client";

import Navigation from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { trpc } from "../_trpc/client";
import { AddPrayerForm } from "./add-prayer-form";

const username = "felixarjuna";

export default function Prayers() {
  const utils = trpc.useContext();
  const { data: prayers } = trpc.prayers.getPrayers.useQuery();

  const updatePrayerCount = trpc.prayers.updatePrayerCount.useMutation({
    onSuccess: () => utils.prayers.invalidate(),
  });

  return (
    <section className="bg-dark-green-default text-cream-default pb-40 min-h-screen">
      <Navigation showNav={true} />
      <div className="pt-20 px-10 flex flex-col items-center xs:px-12 xs:pt-20">
        <div className="flex max-w-5xl px-14 items-center justify-center gap-8 py-16 flex-col xs:w-full xs:py-8 xs:px-0">
          <h1 className="text-9xl font-reimbrandt xs:text-4xl">Pray together</h1>
          <div className="text-2xl flex flex-col gap-y-2 xs:text-base">
            <p>
              “Therefore, I tell you, whatever you ask in prayer, believe that you have received it,
              and it will be yours.”
            </p>
            <p>– Mark 11:24</p>
          </div>
        </div>

        <div className="flex flex-col max-w-5xl w-full px-14 gap-y-4 mt-4 xs:w-full xs:px-0">
          <h3 className="text-2xl font-reimbrandt xs:text-base mb-8 xs:mb-4">
            Let&apos;s pray together every Wednesday at 18.30 a.m 😍
          </h3>

          <AddPrayerForm />
          <div className="bg-green-default/80 w-full rounded-lg px-8 py-4 min-h-[300px] xs:px-4 xs:py-2">
            <h2 className="text-3xl font-reimbrandt xs:text-xl">Prayer&apos;s list</h2>
            <ul className="flex flex-col gap-2 my-4 xs:my-2">
              {prayers?.map((prayer, index) => {
                return (
                  <li className="text-base xs:text-base flex justify-between" key={index}>
                    {prayer.content}
                    <div className="flex gap-x-2 items-center">
                      <Badge variant={"secondary"} className="font-thin">
                        {prayer.name}
                      </Badge>
                      <Toggle
                        className="h-6 w-6 p-1"
                        pressed={prayer.prayers.map((x) => x.name).includes(username)}
                        onPressedChange={(pressed) => {
                          if (pressed) {
                            updatePrayerCount.mutate({
                              id: prayer.id,
                              count: pressed ? prayer.count + 1 : prayer.count - 1,
                              prayerId: 1,
                            });
                          } else {
                            updatePrayerCount.mutate({
                              id: prayer.id,
                              count: pressed ? prayer.count + 1 : prayer.count - 1,
                              prayerId: 1,
                            });
                          }
                        }}
                      >
                        🙏
                      </Toggle>
                      <Badge
                        variant={"secondary"}
                        className="w-8 flex items-center justify-center font-thin"
                      >
                        {prayer.count}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
