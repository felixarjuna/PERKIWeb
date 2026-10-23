"use client";

import { CalendarDays, ChevronDown, Sparkles, Utensils } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { useId, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { type Duty, dutyLabel } from "~/lib/duties";
import { weekOf } from "~/lib/schedule-team";
import { cn } from "~/lib/utils";

/** Gatherings happen in Aachen, so times read in its zone for everyone. */
const ZONE = "Europe/Berlin";

export interface DutyDay {
  date: Date;
  duties: Duty[];
  id: number;
  title: string;
}

const icons = { cleaning: Sparkles, cooking: Utensils } as const;

function DutyBadge({ duty }: { duty: Duty }) {
  return (
    <Badge
      icon={"group" in duty ? icons[duty.role] : undefined}
      size="status"
      variant="published"
    >
      {dutyLabel(duty)}
    </Badge>
  );
}

/** One gathering: the date beside its title, time and what the member does. */
function DutyItem({ day, now }: { day: DutyDay; now: Date }) {
  const local = DateTime.fromJSDate(day.date).setZone(ZONE);
  const thisYear = local.year === DateTime.fromJSDate(now).setZone(ZONE).year;
  return (
    <li className="flex gap-4 rounded-xl bg-card p-4 sm:p-6">
      <time
        className="flex w-12 shrink-0 flex-col items-center text-center"
        dateTime={local.toISO() ?? ""}
      >
        <span className="type-eyebrow text-muted-foreground">
          {local.toFormat("ccc")}
        </span>
        <span className="type-heading tabular-nums">{local.toFormat("d")}</span>
        <span className="type-caption whitespace-nowrap text-muted-foreground">
          {local.toFormat(thisYear ? "LLL" : "LLL ''yy")}
        </span>
      </time>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 flex-col">
          <h3 className="type-body break-words">
            <Link
              className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={`/schedule/${day.id}`}
            >
              {day.title}
            </Link>
          </h3>
          <p className="type-body-sm text-muted-foreground tabular-nums">
            {local.toFormat("HH:mm")}
          </p>
        </div>
        <ul aria-label="Your duties" className="flex flex-wrap gap-2">
          {day.duties.map((duty) => (
            <li key={dutyLabel(duty)}>
              <DutyBadge duty={duty} />
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

function DutySection({
  days,
  now,
  title,
}: {
  days: DutyDay[];
  now: Date;
  title: string;
}) {
  const id = useId();
  if (days.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 className="type-eyebrow text-muted-foreground" id={id}>
        {title}
      </h2>
      <ul className="flex flex-col gap-2">
        {days.map((day) => (
          <DutyItem day={day} key={day.id} now={now} />
        ))}
      </ul>
    </section>
  );
}

function PastDuties({ days, now }: { days: DutyDay[]; now: Date }) {
  const [open, setOpen] = useState(false);
  if (days.length === 0) {
    return null;
  }
  return (
    <Collapsible onOpenChange={setOpen} open={open}>
      <CollapsibleTrigger asChild>
        <Button className="w-fit" type="button" variant="secondary">
          Past duties ({days.length})
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 transition-transform duration-200 motion-reduce:transition-none",
              open && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <ul className="flex flex-col gap-2">
          {days.map((day) => (
            <DutyItem day={day} key={day.id} now={now} />
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

const scheduleLink = (
  <Link
    className={buttonVariants({ className: "w-fit", variant: "secondary" })}
    href="/schedule"
  >
    <CalendarDays aria-hidden="true" className="size-4" />
    See the schedule
  </Link>
);

/**
 * The member's own duties: this week first, then later ones soonest first,
 * with past duties folded away below.
 */
export default function DutiesView({
  now,
  past,
  upcoming,
}: {
  now: Date;
  past: DutyDay[];
  upcoming: DutyDay[];
}) {
  if (past.length === 0 && upcoming.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="type-body">There are no duties linked to you yet</h2>
          <p className="type-body-sm text-pretty text-muted-foreground">
            Your serving slots and your group's cooking and cleaning days show
            up here once your name on the schedule is linked to your account. If
            you're on the schedule and see nothing here, ask a mita to link your
            name.
          </p>
        </div>
        {scheduleLink}
      </div>
    );
  }
  const { before } = weekOf(now);
  return (
    <div className="flex flex-col gap-8">
      {upcoming.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-xl bg-card p-4 sm:p-6">
          <p className="type-body-sm text-muted-foreground">
            There's nothing coming up for you on the schedule yet.
          </p>
          {scheduleLink}
        </div>
      ) : (
        <>
          <DutySection
            days={upcoming.filter((day) => day.date < before)}
            now={now}
            title="This week"
          />
          <DutySection
            days={upcoming.filter((day) => day.date >= before)}
            now={now}
            title="Coming up"
          />
        </>
      )}
      <PastDuties days={past} now={now} />
    </div>
  );
}
