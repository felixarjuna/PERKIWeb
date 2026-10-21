"use client";

import { Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { localDay, localTime, openSlots } from "~/lib/schedule-team";
import { cn } from "~/lib/utils";
import { QueryMessage } from "../admin-controls";

const ZONE = "Europe/Berlin";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export interface CalendarSchedule {
  accommodation: string | null;
  cleaningGroup: string;
  cookingGroup: string | null;
  date: Date;
  id: number;
  leader: string;
  multimedia: string | null;
  musician: string;
  noteWriter: string;
  preacher: string | null;
  title: string;
  type: "church_service" | "bible_study";
}

/** `yyyy-MM`, the month the calendar shows. */
export const monthOf = (date: Date) =>
  DateTime.fromJSDate(date).setZone(ZONE).toFormat("yyyy-MM");

const typeLabel = (type: CalendarSchedule["type"]) =>
  type === "church_service" ? "Church service" : "Bible study";

/** Open slots only matter for gatherings that haven't happened yet. */
const openOf = (schedule: CalendarSchedule, today: string) =>
  localDay(schedule.date) >= today ? openSlots(schedule) : [];

function OpenBadge({ open }: { open: string[] }) {
  return open.length > 0 ? (
    <span className="type-caption w-fit rounded-full bg-paper px-2 text-paper-foreground">
      {open.length} open
    </span>
  ) : (
    <span className="type-caption inline-flex items-center gap-1 text-muted-foreground">
      <Check aria-hidden="true" className="size-3.5" />
      Team complete
    </span>
  );
}

/** One gathering inside a day cell: time, title and how many slots are open. */
function CellEvent({
  schedule,
  today,
}: {
  schedule: CalendarSchedule;
  today: string;
}) {
  const past = localDay(schedule.date) < today;
  const open = openOf(schedule, today);
  return (
    <Link
      className={cn(
        "flex min-w-0 flex-col gap-0.5 rounded-md bg-secondary px-2 py-1.5 transition-colors hover:bg-accent",
        past && "opacity-60"
      )}
      href={`/admin/schedules/${schedule.id}/edit`}
      title={open.length > 0 ? `Open: ${open.join(", ")}` : undefined}
    >
      <span className="type-caption text-muted-foreground tabular-nums">
        {localTime(schedule.date)} · {typeLabel(schedule.type)}
      </span>
      <span className="type-body-sm truncate">{schedule.title}</span>
      {past ? null : <OpenBadge open={open} />}
      {open.length > 0 ? (
        <span className="sr-only">Open: {open.join(", ")}</span>
      ) : null}
    </Link>
  );
}

function MonthGrid({
  month,
  byDay,
  today,
}: {
  month: DateTime;
  byDay: Map<string, CalendarSchedule[]>;
  today: string;
}) {
  const first = month.startOf("month").startOf("week");
  const last = month.endOf("month").endOf("week");
  const days: DateTime[] = [];
  for (let day = first; day <= last; day = day.plus({ days: 1 })) {
    days.push(day);
  }
  return (
    <div className="@2xl:block hidden">
      <div className="grid grid-cols-7 gap-px pb-2">
        {WEEKDAYS.map((weekday) => (
          <p className="type-eyebrow px-2 text-muted-foreground" key={weekday}>
            {weekday}
          </p>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = day.toISODate() ?? "";
          const inMonth = day.month === month.month;
          const events = byDay.get(key) ?? [];
          const label = day.toFormat("cccc d LLLL");
          return (
            <li
              className={cn(
                "group flex min-h-28 flex-col gap-1 rounded-lg bg-card p-1.5",
                !inMonth && "bg-card/40"
              )}
              key={key}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "type-caption grid size-6 place-items-center rounded-full tabular-nums",
                    inMonth ? "text-foreground" : "text-muted-foreground/60",
                    key === today && "bg-primary text-primary-foreground"
                  )}
                >
                  <span className="sr-only">{label}</span>
                  <span aria-hidden="true">{day.day}</span>
                </span>
                {key >= today && events.length === 0 ? (
                  <Link
                    aria-label={`Add a schedule on ${label}`}
                    className="grid size-6 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                    href={`/admin/schedules/new?date=${key}`}
                  >
                    <Plus aria-hidden="true" className="size-4" />
                  </Link>
                ) : null}
              </div>
              {events.map((schedule) => (
                <CellEvent
                  key={schedule.id}
                  schedule={schedule}
                  today={today}
                />
              ))}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Phones: the month's gatherings as a list, with the open slots named. */
function MonthAgenda({
  schedules,
  today,
}: {
  schedules: CalendarSchedule[];
  today: string;
}) {
  return (
    <ul className="flex @2xl:hidden flex-col gap-2">
      {schedules.map((schedule) => {
        const date = DateTime.fromJSDate(schedule.date).setZone(ZONE);
        const past = localDay(schedule.date) < today;
        const open = openOf(schedule, today);
        return (
          <li key={schedule.id}>
            <Link
              className={cn(
                "flex gap-4 rounded-xl bg-card p-4 transition-colors hover:bg-accent/40",
                past && "opacity-60"
              )}
              href={`/admin/schedules/${schedule.id}/edit`}
            >
              <span className="flex h-16 w-12 shrink-0 flex-col items-center justify-center self-start rounded-lg bg-secondary">
                <span className="type-caption text-muted-foreground">
                  {date.toFormat("ccc")}
                </span>
                <span className="type-body tabular-nums">{date.day}</span>
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="type-caption text-muted-foreground tabular-nums">
                  {localTime(schedule.date)} · {typeLabel(schedule.type)}
                </span>
                <span className="type-body-sm break-words">
                  {schedule.title}
                </span>
                {past ? null : <OpenBadge open={open} />}
                {open.length > 0 ? (
                  <span className="type-caption text-muted-foreground">
                    {open.join(", ")}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A month of gatherings for planning: each upcoming one shows how many of
 * its slots are still open, and an empty upcoming day links to "Add schedule".
 */
export default function ScheduleCalendar({
  schedules,
  month: monthKey,
  onMonthChange,
}: {
  schedules: CalendarSchedule[];
  month: string;
  onMonthChange: (month: string) => void;
}) {
  const now = DateTime.now().setZone(ZONE);
  const today = now.toISODate() ?? "";
  const parsed = DateTime.fromFormat(monthKey, "yyyy-MM", { zone: ZONE });
  const month = (parsed.isValid ? parsed : now).startOf("month");
  const inMonth = schedules
    .filter((schedule) => monthOf(schedule.date) === month.toFormat("yyyy-MM"))
    .sort((a, b) => a.date.getTime() - b.date.getTime() || a.id - b.id);
  const byDay = new Map<string, CalendarSchedule[]>();
  for (const schedule of inMonth) {
    const key = localDay(schedule.date);
    byDay.set(key, [...(byDay.get(key) ?? []), schedule]);
  }
  const openCount = inMonth.reduce(
    (sum, schedule) => sum + openOf(schedule, today).length,
    0
  );
  const go = (months: number) =>
    onMonthChange(month.plus({ months }).toFormat("yyyy-MM"));

  return (
    <section aria-labelledby="calendar-month" className="@container">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="type-subheading" id="calendar-month">
            {month.toFormat("LLLL yyyy")}
          </h2>
          <p aria-live="polite" className="type-caption text-muted-foreground">
            {inMonth.length === 1
              ? "1 gathering"
              : `${inMonth.length} gatherings`}
            {openCount > 0
              ? ` · ${openCount} open ${openCount === 1 ? "slot" : "slots"}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            aria-label="Previous month"
            onClick={() => go(-1)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <Button
            disabled={month.hasSame(now, "month")}
            onClick={() => onMonthChange(now.toFormat("yyyy-MM"))}
            size="sm"
            type="button"
            variant="secondary"
          >
            Today
          </Button>
          <Button
            aria-label="Next month"
            onClick={() => go(1)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
      <MonthGrid byDay={byDay} month={month} today={today} />
      {inMonth.length > 0 ? (
        <MonthAgenda schedules={inMonth} today={today} />
      ) : (
        <div className="@2xl:hidden">
          <QueryMessage>No gatherings this month.</QueryMessage>
        </div>
      )}
    </section>
  );
}
