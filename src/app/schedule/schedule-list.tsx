"use client";

import {
  Bed,
  Music,
  NotebookPen,
  PersonStanding,
  Sparkles,
  Utensils,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import ActionButton from "~/components/action-button";
import Loader from "~/components/loader";
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
import { groups } from "~/lib/data";
import { dateTimeFormatter, getNextDayOfWeek } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import RandomVerse from "./random-verse";

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
];

export default function ScheduleList({
  management = false,
}: {
  management?: boolean;
}) {
  const { data: schedules } = api.schedules.getSchedules.useQuery();

  const router = useRouter();

  function renderScheduleDetails(schedule: Schedule) {
    const details = [
      schedule.preacher,
      schedule.bibleVerse,
      dateTimeFormatter(schedule.date.toString()),
    ].filter(Boolean);

    return (
      <div className="type-caption flex flex-wrap items-center gap-x-2 gap-y-1 whitespace-break-spaces text-muted-foreground">
        {details.map((detail, index) => (
          <React.Fragment key={detail}>
            {index > 0 ? <span>&middot;</span> : null}
            <p>{detail}</p>
          </React.Fragment>
        ))}
      </div>
    );
  }

  function renderScheduleSummary(schedule: Schedule) {
    let { description } = schedule;
    if (description.length > SUMMARY_MAX_LENGTH) {
      description = `${description.slice(0, SUMMARY_MAX_LENGTH)}...`;
    }

    return (
      <div className="mt-4">
        <p className="type-body">{description}</p>
        {schedule.description.length > SUMMARY_MAX_LENGTH ? (
          <details className="mt-3">
            <summary className="type-body-sm w-fit cursor-pointer rounded-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Read full description
            </summary>
            <p className="type-body mt-3 whitespace-pre-wrap">
              {schedule.description}
            </p>
          </details>
        ) : null}
      </div>
    );
  }

  function renderScheduleServants(schedule: Schedule) {
    const cookingGroupMembers = groups.find(
      (group) =>
        group.name.toLowerCase() === schedule.cookingGroup?.toLowerCase()
    )?.members;

    const cleaningGroupMembers = groups.find(
      (group) =>
        group.name.toLowerCase() === schedule.cleaningGroup?.toLowerCase()
    )?.members;

    return (
      <div className="type-body-sm flex min-w-0 flex-col justify-center gap-2 p-4 sm:w-48 sm:shrink-0">
        <div className="flex items-center gap-x-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/60 p-1 sm:h-7 sm:w-7">
            <PersonStanding className="h-5 w-5" />
          </div>
          <p>{schedule.leader || "-"}</p>
        </div>

        <div className="flex items-center gap-x-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/60 p-1 sm:h-7 sm:w-7">
            <Music className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
          <p>{schedule.musician}</p>
        </div>
        <div className="flex items-center gap-x-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/60 p-1 sm:h-7 sm:w-7">
            <NotebookPen className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
          <p>{schedule.noteWriter || "-"}</p>
        </div>
        <div className="flex items-center gap-x-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/60 p-1 sm:h-7 sm:w-7">
            <Bed className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
          <p>{schedule.accommodation ?? "-"}</p>
        </div>

        <Drawer>
          <DrawerTrigger
            className="min-h-10 rounded-md text-start hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
          >
            <div className="flex items-center gap-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/60 p-1 sm:h-7 sm:w-7">
                <Utensils className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <p>{schedule.cookingGroup ?? "-"}</p>
            </div>
          </DrawerTrigger>
          <DrawerContent className="border-0 text-foreground">
            <DrawerHeader>
              <DrawerTitle>{schedule.cookingGroup}</DrawerTitle>
              <DrawerDescription asChild>
                <div className="flex items-center justify-center gap-2 py-6">
                  <div className="flex flex-col gap-4">
                    <RandomVerse items={verses} />

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {cookingGroupMembers?.map((member) => (
                        <div
                          className="type-body-sm w-fit rounded-full bg-paper px-3 py-1 text-paper-foreground"
                          key={member}
                        >
                          {member}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="pt-0">
              <Button
                className="w-fit self-center"
                onClick={() => router.push("/group")}
              >
                See all groups
              </Button>
              <DrawerClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Drawer>
          <DrawerTrigger
            className="min-h-10 rounded-md text-start hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
          >
            <div className="flex items-center gap-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/60 p-1 sm:h-7 sm:w-7">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <p>{schedule.cleaningGroup}</p>
            </div>
          </DrawerTrigger>
          <DrawerContent className="border-0 text-foreground">
            <DrawerHeader>
              <DrawerTitle>{schedule.cleaningGroup}</DrawerTitle>
              <DrawerDescription asChild>
                <div className="flex items-center justify-center gap-2 py-6">
                  <div className="flex flex-col gap-4">
                    <RandomVerse items={verses} />

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {cleaningGroupMembers?.map((member) => (
                        <div
                          className="type-body-sm w-fit rounded-full bg-paper px-3 py-1 text-paper-foreground"
                          key={member}
                        >
                          {member}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="pt-0">
              <Button
                className="w-fit self-center"
                onClick={() => router.push("/group")}
              >
                See all groups
              </Button>
              <DrawerClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  function renderSchedule(schedule: Schedule) {
    return (
      <div
        className="flex h-full flex-col rounded-xl bg-card transition-colors duration-150 hover:bg-accent/40 sm:flex-row"
        key={schedule.id}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="type-subheading min-w-0 flex-1 break-words">
              {schedule.title}
            </h3>
            {management ? (
              <ScheduleActions
                className="hidden gap-x-2 sm:flex"
                scheduleId={schedule.id}
              />
            ) : null}
          </div>
          {renderScheduleDetails(schedule)}
          {renderScheduleSummary(schedule)}
        </div>

        <Separator
          className="mx-auto h-px w-5/6 bg-border sm:mx-0 sm:h-auto sm:w-px sm:self-stretch"
          orientation="vertical"
        />

        {renderScheduleServants(schedule)}
        {management ? (
          <ScheduleActions
            className="flex w-full place-content-end gap-x-2 px-4 pb-4 sm:hidden"
            scheduleId={schedule.id}
          />
        ) : null}
      </div>
    );
  }

  function renderScheduleCollection(
    list: Schedule[] | undefined,
    loadingMessage: string
  ) {
    if (!list) {
      return <Loader message={loadingMessage} />;
    }

    if (list.length === 0) {
      return (
        <p className="type-body rounded-xl bg-card p-4 text-muted-foreground sm:p-6">
          No gatherings scheduled here yet.
        </p>
      );
    }

    return list.map((schedule) => renderSchedule(schedule));
  }

  const thisWeekSchedule = React.useMemo(() => {
    const mondayDate = getNextDayOfWeek(new Date(), 0);
    const saturdayDate = getNextDayOfWeek(new Date(), 6);

    return schedules
      ?.filter(
        (schedule) => schedule.date > mondayDate && schedule.date < saturdayDate
      )
      .sort((a, b) => {
        if (a.date > b.date) {
          return 1;
        }
        return -1;
      });
  }, [schedules]);

  function renderThisWeekSchedule() {
    return (
      <div className="space-y-4">
        <h2 className="type-heading">This Week</h2>
        {renderScheduleCollection(
          thisWeekSchedule,
          "Loading this week schedules ..."
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
        <h2 className="type-heading">Upcoming Schedules</h2>
        {renderScheduleCollection(
          upcomingSchedules,
          "Loading upcoming schedules ..."
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
        <h2 className="type-heading">Previous Schedules</h2>
        {renderScheduleCollection(
          previousSchedules,
          "Loading previous schedules ..."
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

function ScheduleActions({
  scheduleId,
  className,
}: {
  scheduleId: number;
  className: string;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const deletion = api.schedules.deleteSchedule.useMutation({
    onError: () =>
      toast.error("Could not delete the schedule. Please try again."),
    onSuccess: async () => {
      await utils.schedules.invalidate();
      toast.success("Schedule successfully deleted!");
    },
  });
  return (
    <ActionButton
      className={className}
      deleteDescription="This will permanently delete the schedule and every takeaway written for it. This cannot be undone."
      onDeleteClick={() => deletion.mutate({ id: scheduleId })}
      onEditClick={() => router.push(`/admin/schedules/${scheduleId}/edit`)}
    />
  );
}
