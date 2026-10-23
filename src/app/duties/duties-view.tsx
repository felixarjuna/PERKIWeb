"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { weekOf } from "~/lib/schedule-team";
import { cn } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";
import ScheduleCard from "../schedule/schedule-card";

export type DutyGathering =
  RouterOutputs["schedules"]["myDuties"]["upcoming"][number];

/** A schedule section: the same heading and card rhythm as `/schedule`. */
function DutySection({
  gatherings,
  title,
}: {
  gatherings: DutyGathering[];
  title: string;
}) {
  const id = useId();
  if (gatherings.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 className="type-heading" id={id}>
        {title}
      </h2>
      <div>
        {gatherings.map((gathering) => (
          <ScheduleCard
            key={gathering.id}
            schedule={gathering}
            yours={gathering.duties}
          />
        ))}
      </div>
    </section>
  );
}

/** Past duties only grow, so they stay folded until asked for. */
function PastDuties({ gatherings }: { gatherings: DutyGathering[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (gatherings.length === 0) {
    return null;
  }
  const count =
    gatherings.length === 1
      ? "1 past duty"
      : `${gatherings.length} past duties`;
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 className="type-heading" id={id}>
        Previous
      </h2>
      <Collapsible onOpenChange={setOpen} open={open}>
        <CollapsibleTrigger asChild>
          <Button className="w-fit" type="button" variant="secondary">
            {open ? "Hide past duties" : `Show ${count}`}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 transition-transform duration-200 motion-reduce:transition-none",
                open && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-6">
          {gatherings.map((gathering) => (
            <ScheduleCard
              key={gathering.id}
              schedule={gathering}
              yours={gathering.duties}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </section>
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
 * The member's gatherings on the schedule's own timeline, each with their
 * part marked: this week, then upcoming soonest first, then past ones folded.
 */
export default function DutiesView({
  now,
  past,
  upcoming,
}: {
  now: Date;
  past: DutyGathering[];
  upcoming: DutyGathering[];
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
    <div className="space-y-8">
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
            gatherings={upcoming.filter((gathering) => gathering.date < before)}
            title="This week"
          />
          <DutySection
            gatherings={upcoming.filter(
              (gathering) => gathering.date >= before
            )}
            title="Upcoming"
          />
        </>
      )}
      <PastDuties gatherings={past} />
    </div>
  );
}
