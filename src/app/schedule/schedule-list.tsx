"use client";

import { dateTimeFormatter } from "@/lib/utils";
import { Bed, Music, PersonStanding, Sparkles, Utensils } from "lucide-react";
import { trpc } from "../_trpc/client";

export default function ScheduleList() {
  const { data: schedules } = trpc.schedules.getSchedules.useQuery();

  return (
    <div className="mt-8 space-y-4 xs:mt-4">
      {schedules?.map((schedule, index) => {
        return (
          <div key={index} className="grid grid-cols-4 gap-x-4 gap-y-2">
            <div className="col-span-3 p-6 bg-green-default/60 rounded-lg w-full hover:bg-green-default/80 shadow-lg transition duration-300 cursor-pointer xs:col-span-4">
              <h1 className="text-2xl font-reimbrandt tracking-wide">{schedule.title}</h1>
              <div className="flex items-center gap-x-2 text-green-400/80 font-reimbrandt xs:text-xs xs:gap-x-1 xs:flex-wrap">
                <p>{schedule.speaker}</p>
                <span>&middot;</span>
                <p>{schedule.bibleVerse}</p>
                <span>&middot;</span>
                <p>{dateTimeFormatter(schedule.date.toString())}</p>
              </div>
              <p className="mt-4 xs:text-sm">{schedule.summary}</p>
            </div>
            <div className="col-span-1 bg-green-default/60 rounded-lg w-full p-6 space-y-2 flex flex-col justify-center hover:bg-green-default/80 shadow-lg transition duration-300 xs:col-span-4 xs:text-sm">
              <div className="flex gap-x-2 items-center">
                <div className="w-7 h-7 xs:w-6 xs:h-6 bg-green-default/60 rounded-lg p-1 flex items-center justify-center">
                  <PersonStanding className="w-5 h-5" />
                </div>
                <p>{schedule.liturgos ?? "-"}</p>
              </div>
              <div className="flex gap-x-2 items-center">
                <div className="w-7 h-7 xs:w-6 xs:h-6 bg-green-default/60 rounded-lg p-1 flex items-center justify-center">
                  <Music className="w-4 h-4 xs:h-3 xs:w-3" />
                </div>
                <p>{schedule.musician ?? "-"}</p>
              </div>
              <div className="flex gap-x-2 items-center">
                <div className="w-7 h-7 xs:w-6 xs:h-6 bg-green-default/60 rounded-lg p-1 flex items-center justify-center">
                  <Bed className="w-4 h-4 xs:h-3 xs:w-3" />
                </div>
                <p>{schedule.accommodation ?? "-"}</p>
              </div>
              <div className="flex gap-x-2 items-center">
                <div className="w-7 h-7 xs:w-6 xs:h-6 bg-green-default/60 rounded-lg p-1 flex items-center justify-center">
                  <Utensils className="w-4 h-4 xs:h-3 xs:w-3" />
                </div>
                <p>{schedule.cookingGroup ?? "-"}</p>
              </div>
              <div className="flex gap-x-2 items-center">
                <div className="w-7 h-7 xs:w-6 xs:h-6 bg-green-default/60 rounded-lg p-1 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 xs:h-3 xs:w-3" />
                </div>
                <p>{schedule.cleaningGroup}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
