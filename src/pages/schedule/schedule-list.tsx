"use client";

import { Bed, Music, PersonStanding, Sparkles, Utensils } from "lucide-react";
import { useRouter } from "next/router";
import React from "react";
import ActionButton from "~/components/action-button";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";

import Loader from "~/components/loader";
import { dateTimeFormatter, getNextDayOfWeek } from "~/lib/utils";
import { api, type RouterOutputs } from "~/utils/api";
import { groups } from "../group";
import RandomVerse from "./_components/random-verse";

type Schedule = RouterOutputs["schedules"]["getSchedules"][number];
const SUMMARY_MAX_LENGTH = 250;

const verses = [
  'Psalm 133:1 — "How good and pleasant it is when God’s people live together in unity!"',
  '1 Corinthians 12:12 — "Just as a body, though one, has many parts, but all its many parts form one body, so it is with Christ."',
  'Hebrews 13:16 — "And do not forget to do good and to share with others, for with such sacrifices God is pleased."',
  'Romans 12:10 — "Be devoted to one another in love. Honor one another above yourselves."',
  'Proverbs 27:17 — "As iron sharpens iron, so one person sharpens another."',
  'John 15:12 — "My command is this: Love each other as I have loved you."',
  'Acts 4:32 — "All the believers were one in heart and mind. No one claimed that any of their possessions was their own, but they shared everything they had."',
  'Ecclesiastes 4:9 — "Two are better than one, because they have a good return for their labor."',
  '1 Corinthians 12:12 — "Just as a body, though one, has many parts, but all its many parts form one body, so it is with Christ."',
];

export default function ScheduleList() {
  const { toast } = useToast();
  const utils = api.useContext();
  const { data: schedules } = api.schedules.getSchedules.useQuery();

  const deleteSchedule = api.schedules.deleteSchedule.useMutation({
    onSuccess: async () => {
      await utils.schedules.invalidate();
      toast({
        title: "Schedule successfully deleted! 🥸",
      });
    },
  });

  const router = useRouter();

  function renderScheduleDetails(schedule: Schedule) {
    return (
      <div className="flex flex-wrap items-center gap-x-1 whitespace-break-spaces font-reimbrandt text-xs text-green-400/80 sm:gap-x-2">
        <p>{schedule.speaker}</p>
        <span>&middot;</span>
        <p>{schedule.bibleVerse}</p>
        <span>&middot;</span>
        <p>{dateTimeFormatter(schedule.date.toString())}</p>
      </div>
    );
  }

  function renderScheduleSummary(schedule: Schedule) {
    let summary = schedule.summary;
    if (summary.length > SUMMARY_MAX_LENGTH) {
      summary = `${summary.substring(0, SUMMARY_MAX_LENGTH)}...`;
    }

    return <p className="mt-4 text-sm">{summary}</p>;
  }

  function renderScheduleServants(schedule: Schedule) {
    const cookingGroupMembers = groups
      .filter(
        (group) =>
          group.name.toLowerCase() === schedule.cookingGroup?.toLowerCase(),
      )
      .at(0)?.members;

    const cleaningGroupMembers = groups
      .filter(
        (group) =>
          group.name.toLowerCase() === schedule.cleaningGroup?.toLowerCase(),
      )
      .at(0)?.members;

    return (
      <div className="flex flex-col justify-center space-y-2 p-8 text-sm sm:w-1/4">
        <div className="flex items-center gap-x-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-default/60 p-1 sm:h-7 sm:w-7">
            <PersonStanding className="h-5 w-5" />
          </div>
          <p>{schedule.liturgos ?? "-"}</p>
        </div>
        <div className="flex items-center gap-x-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-default/60 p-1 sm:h-7 sm:w-7">
            <Music className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
          <p>{schedule.musician ?? "-"}</p>
        </div>
        <div className="flex items-center gap-x-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-default/60 p-1 sm:h-7 sm:w-7">
            <Bed className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
          <p>{schedule.accommodation ?? "-"}</p>
        </div>

        <Drawer>
          <DrawerTrigger>
            <div className="flex items-center gap-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-default/60 p-1 sm:h-7 sm:w-7">
                <Utensils className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <p>{schedule.cookingGroup ?? "-"}</p>
            </div>
          </DrawerTrigger>
          <DrawerContent className="border-0 text-primary-foreground">
            <DrawerHeader>
              <DrawerTitle>{schedule.cookingGroup}</DrawerTitle>
              <DrawerDescription className="flex items-center justify-center gap-2 py-6">
                <div className="flex flex-col gap-4">
                  <RandomVerse items={verses} />

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {cookingGroupMembers?.map((member, i) => (
                      <div
                        className="w-fit rounded-full bg-primary-foreground px-3 py-1  text-secondary-foreground"
                        key={i}
                      >
                        {member}
                      </div>
                    ))}
                  </div>
                </div>
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="pt-0">
              <Button
                className="w-fit self-center"
                onClick={() => void router.push("/group")}
              >
                See all groups
              </Button>
              <DrawerClose>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Drawer>
          <DrawerTrigger>
            <div className="flex items-center gap-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-default/60 p-1 sm:h-7 sm:w-7">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <p>{schedule.cleaningGroup}</p>
            </div>
          </DrawerTrigger>
          <DrawerContent className="border-0 text-primary-foreground">
            <DrawerHeader>
              <DrawerTitle>{schedule.cleaningGroup}</DrawerTitle>
              <DrawerDescription className="flex items-center justify-center gap-2  py-6">
                <div className="flex flex-col gap-4">
                  <RandomVerse items={verses} />

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {cleaningGroupMembers?.map((member, i) => (
                      <div
                        className="w-fit rounded-full bg-primary-foreground px-3 py-1 text-secondary-foreground"
                        key={i}
                      >
                        {member}
                      </div>
                    ))}
                  </div>
                </div>
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="pt-0">
              <Button
                className="w-fit self-center"
                onClick={() => void router.push("/group")}
              >
                See all groups
              </Button>
              <DrawerClose>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  function renderMobileActionButton(schedule: Schedule) {
    return (
      <ActionButton
        className="visible flex w-full place-content-end gap-x-2 px-8 pb-8 sm:hidden xl:hidden"
        onEditClick={() => void router.push(`/edit-schedule/${schedule.id}`)}
        onDeleteClick={() => deleteSchedule.mutate({ id: schedule.id })}
      />
    );
  }

  function renderDesktopActionButton(schedule: Schedule) {
    return (
      <ActionButton
        className="hidden gap-x-2 sm:flex"
        onEditClick={() => void router.push(`/edit-schedule/${schedule.id}`)}
        onDeleteClick={() => deleteSchedule.mutate({ id: schedule.id })}
      />
    );
  }

  function renderSchedule(schedule: Schedule) {
    return (
      <div
        className="flex h-full flex-col gap-y-0 rounded-lg
      bg-green-default/60 shadow-lg transition duration-300 hover:bg-green-default/80 sm:flex-row sm:gap-y-2"
      >
        <div className="cursor-pointer space-y-2 p-8 sm:w-3/4 xl:w-3/4">
          <div className="flex items-center justify-between">
            <h1 className="font-reimbrandt text-xl tracking-wide">
              {schedule.title}
            </h1>
            {renderDesktopActionButton(schedule)}
          </div>
          {renderScheduleDetails(schedule)}
          {renderScheduleSummary(schedule)}
        </div>

        <Separator
          orientation="vertical"
          className="mx-auto h-px w-5/6 rounded-lg bg-cream-default sm:my-auto sm:h-48 sm:w-px xl:my-auto xl:h-48 xl:w-px"
        />

        {renderScheduleServants(schedule)}
        {renderMobileActionButton(schedule)}
      </div>
    );
  }

  const thisWeekSchedule = React.useMemo(() => {
    const mondayDate = getNextDayOfWeek(new Date(), 0);
    const saturdayDate = getNextDayOfWeek(new Date(), 6);

    return schedules
      ?.filter(
        (schedule) =>
          schedule.date > mondayDate && schedule.date < saturdayDate,
      )
      .sort((a, b) => {
        if (a.date > b.date) return 1;
        return -1;
      });
  }, [schedules]);

  function renderThisWeekSchedule() {
    return (
      <div className="space-y-4">
        <h1 className="font-reimbrandt text-2xl tracking-wide">This Week</h1>
        {!thisWeekSchedule ? (
          <Loader message="Loading this week schedules ..." />
        ) : thisWeekSchedule.length === 0 ? (
          <div>No schedule found.</div>
        ) : (
          thisWeekSchedule.map((schedule) => renderSchedule(schedule))
        )}
      </div>
    );
  }

  const upcomingSchedules = React.useMemo(() => {
    const saturdayDate = getNextDayOfWeek(new Date(), 6);
    return schedules
      ?.filter((schedule) => schedule.date > saturdayDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [schedules]);

  function renderUpcomingSchedule() {
    return (
      <div className="space-y-4">
        <h1 className="font-reimbrandt text-2xl tracking-wide">
          Upcoming Schedules
        </h1>
        {!upcomingSchedules ? (
          <Loader message="Loading upcoming schedules ..." />
        ) : upcomingSchedules.length === 0 ? (
          <div>No schedule found.</div>
        ) : (
          upcomingSchedules.map((schedule) => renderSchedule(schedule))
        )}
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const previousSchedules = React.useMemo(() => {
    const sundayDate = getNextDayOfWeek(new Date(), 0);
    return schedules?.filter((schedule) => schedule.date < sundayDate);
  }, [schedules]);

  function renderPreviousSchedule() {
    return (
      <div className="space-y-4">
        <h1 className="font-reimbrandt text-2xl tracking-wide">
          Previous Schedules
        </h1>
        {!previousSchedules ? (
          <Loader message="Loading previous schedules ..." />
        ) : previousSchedules.length === 0 ? (
          <div>No schedule found.</div>
        ) : (
          previousSchedules.map((schedule) => renderSchedule(schedule))
        )}
      </div>
    );
  }

  return (
    <section className="mt-8 space-y-8">
      {renderThisWeekSchedule()}
      {renderUpcomingSchedule()}
      {renderPreviousSchedule()}
    </section>
  );
}
