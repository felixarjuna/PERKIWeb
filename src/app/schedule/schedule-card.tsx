"use client";

import { ChevronDown, Sparkles, Utensils } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import React from "react";
import { PeopleGrid, PersonAvatar } from "~/components/person-avatar";
import { Button, buttonVariants } from "~/components/ui/button";
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
import { servingRoleLabels } from "~/lib/serving-roles";
import { cn } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";
import RandomVerse from "./random-verse";

type Schedule = RouterOutputs["schedules"]["getSchedules"][number];

/** Descriptions longer than this are clamped to three lines. */
const LONG_DESCRIPTION = 180;
/** Gatherings happen in Aachen, so times read in its zone for everyone. */
const ZONE = "Europe/Berlin";

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

function formatDate(date: Date) {
  const local = DateTime.fromJSDate(date).setZone(ZONE);
  const thisYear = local.year === DateTime.now().setZone(ZONE).year;
  return {
    day: local.toFormat("d"),
    iso: local.toISO() ?? "",
    month: local.toFormat(thisYear ? "LLL" : "LLL ''yy"),
    time: local.toFormat("HH:mm"),
    weekday: local.toFormat("ccc"),
  };
}

/** Who serves, in slot order; the preacher is shown under the title instead. */
function team(schedule: Schedule) {
  return schedule.team
    .filter((slot) => slot.role !== "preacher")
    .map((slot) => ({
      image: slot.image,
      label: servingRoleLabels[slot.role],
      name: slot.name,
    }));
}

function duties(schedule: Schedule) {
  return [
    {
      icon: Utensils,
      label: "Cooking",
      members: schedule.groupMembers.cooking,
      name: schedule.cookingGroup,
    },
    {
      icon: Sparkles,
      label: "Cleaning",
      members: schedule.groupMembers.cleaning,
      name: schedule.cleaningGroup,
    },
  ].filter((duty): duty is typeof duty & { name: string } =>
    Boolean(duty.name)
  );
}

function Description({ text }: { text: string }) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  if (!text) {
    return null;
  }
  const long = text.length > LONG_DESCRIPTION;
  return (
    <div className="mt-3">
      <p
        className={cn(
          "type-body whitespace-pre-line text-pretty",
          long && !open && "line-clamp-3"
        )}
        id={id}
      >
        {text}
      </p>
      {long ? (
        <Button
          aria-controls={id}
          aria-expanded={open}
          className="-ms-3 mt-1 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen((value) => !value)}
          size="sm"
          type="button"
          variant="ghost"
        >
          {open ? "Show less" : "Show more"}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 transition-transform duration-200 motion-reduce:transition-none",
              open && "rotate-180"
            )}
          />
        </Button>
      ) : null}
    </div>
  );
}

function DutyDrawer({ duty }: { duty: ReturnType<typeof duties>[number] }) {
  const { members } = duty;
  return (
    <Drawer>
      <DrawerTrigger
        className={buttonVariants({ size: "sm", variant: "secondary" })}
        type="button"
      >
        <duty.icon aria-hidden="true" className="size-4" />
        {duty.label} · {duty.name}
      </DrawerTrigger>
      <DrawerContent className="border-0 text-foreground">
        <DrawerHeader>
          <DrawerTitle>
            {duty.label}: {duty.name}
          </DrawerTitle>
          <DrawerDescription asChild>
            <div className="flex flex-col items-center gap-4 py-6">
              <RandomVerse items={verses} />
              {members ? (
                <PeopleGrid className="justify-center" people={members} />
              ) : (
                <p className="type-body-sm text-muted-foreground">
                  The members of this group aren't listed for this date.
                </p>
              )}
            </div>
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="items-center pt-0">
          <Link className={buttonVariants()} href="/group">
            See all groups
          </Link>
          <DrawerClose asChild>
            <Button type="button" variant="ghost">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/** One gathering on the schedule timeline: the date on a rail, details beside it. */
export default function ScheduleCard({ schedule }: { schedule: Schedule }) {
  const date = formatDate(schedule.date);
  const preacher = schedule.team.find((slot) => slot.role === "preacher");
  return (
    <article className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-x-6">
      <div className="flex flex-col items-center">
        <time
          className="flex flex-col items-center text-center"
          dateTime={date.iso}
        >
          <span className="type-eyebrow text-muted-foreground">
            {date.weekday}
          </span>
          <span className="type-title tabular-nums">{date.day}</span>
          <span className="type-caption whitespace-nowrap text-muted-foreground">
            {date.month}
          </span>
        </time>
        <span aria-hidden="true" className="mt-3 w-px flex-1 bg-border" />
      </div>

      <div className="min-w-0 pb-8">
        <p className="type-body-sm text-muted-foreground tabular-nums">
          {[date.time, schedule.bibleVerse].filter(Boolean).join(" · ")}
        </p>
        <h3 className="type-heading mt-1 break-words">{schedule.title}</h3>
        {preacher ? (
          <p className="type-body-sm mt-1.5 flex items-center gap-2 text-muted-foreground">
            <PersonAvatar person={preacher} size="sm" />
            Preached by {preacher.name}
          </p>
        ) : null}
        <Description text={schedule.description} />

        <dl className="type-body-sm mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
          {team(schedule).map((role) => (
            <div className="flex items-center gap-1.5" key={role.label}>
              <dt className="text-muted-foreground">{role.label}</dt>
              <dd className="flex min-w-0 items-center gap-1.5 break-words">
                <PersonAvatar person={role} size="sm" />
                {role.name}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          {duties(schedule).map((duty) => (
            <DutyDrawer duty={duty} key={duty.label} />
          ))}
        </div>
      </div>
    </article>
  );
}
