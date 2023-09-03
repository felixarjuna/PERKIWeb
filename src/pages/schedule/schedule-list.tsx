"use client";

import { Bed, Music, PersonStanding, Sparkles, Utensils } from "lucide-react";
import { dateTimeFormatter } from "~/lib/utils";
import { api } from "~/utils/api";

export default function ScheduleList() {
  const { data: schedules } = api.schedules.getSchedules.useQuery();

  return (
    <div className="mt-8 space-y-4 xs:mt-4">
      {schedules?.map((schedule, index) => {
        return (
          <div key={index} className="grid grid-cols-4 gap-x-4 gap-y-2">
            <div className="col-span-3 w-full cursor-pointer rounded-lg bg-green-default/60 p-6 shadow-lg transition duration-300 hover:bg-green-default/80 xs:col-span-4">
              <h1 className="font-reimbrandt text-2xl tracking-wide">
                {schedule.title}
              </h1>
              <div className="flex items-center gap-x-2 font-reimbrandt text-green-400/80 xs:flex-wrap xs:gap-x-1 xs:text-xs">
                <p>{schedule.speaker}</p>
                <span>&middot;</span>
                <p>{schedule.bibleVerse}</p>
                <span>&middot;</span>
                <p>{dateTimeFormatter(schedule.date.toString())}</p>
              </div>
              <p className="mt-4 xs:text-sm">{schedule.summary}</p>
            </div>
            <div className="col-span-1 flex w-full flex-col justify-center space-y-2 rounded-lg bg-green-default/60 p-6 shadow-lg transition duration-300 hover:bg-green-default/80 xs:col-span-4 xs:text-sm">
              <div className="flex items-center gap-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-default/60 p-1 xs:h-6 xs:w-6">
                  <PersonStanding className="h-5 w-5" />
                </div>
                <p>{schedule.liturgos ?? "-"}</p>
              </div>
              <div className="flex items-center gap-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-default/60 p-1 xs:h-6 xs:w-6">
                  <Music className="h-4 w-4 xs:h-3 xs:w-3" />
                </div>
                <p>{schedule.musician ?? "-"}</p>
              </div>
              <div className="flex items-center gap-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-default/60 p-1 xs:h-6 xs:w-6">
                  <Bed className="h-4 w-4 xs:h-3 xs:w-3" />
                </div>
                <p>{schedule.accommodation ?? "-"}</p>
              </div>
              <div className="flex items-center gap-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-default/60 p-1 xs:h-6 xs:w-6">
                  <Utensils className="h-4 w-4 xs:h-3 xs:w-3" />
                </div>
                <p>{schedule.cookingGroup ?? "-"}</p>
              </div>
              <div className="flex items-center gap-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-default/60 p-1 xs:h-6 xs:w-6">
                  <Sparkles className="h-4 w-4 xs:h-3 xs:w-3" />
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
