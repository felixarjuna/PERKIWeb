"use client";

import { Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { localDay, localTime } from "~/lib/schedule-team";
import { cn } from "~/lib/utils";
import { QueryMessage } from "../admin-controls";

const ZONE = "Europe/Berlin";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** `yyyy-MM`, the month a calendar shows. */
export const monthOf = (date: Date) =>
  DateTime.fromJSDate(date).setZone(ZONE).toFormat("yyyy-MM");

const typeLabel = (type: "church_service" | "bible_study") =>
  type === "church_service" ? "Church service" : "Bible study";

/** "15:30 · Bible study": the time in Aachen and the kind of gathering. */
export const gatheringLine = (
  date: Date,
  type: "church_service" | "bible_study"
) => `${localTime(date)} · ${typeLabel(type)}`;

/** One gathering on the calendar, already described by the caller. */
export interface CalendarItem {
  /** The short status in a month-grid cell. */
  compactStatus?: ReactNode;
  date: Date;
  /** Past or skipped: shown faded. */
  dimmed?: boolean;
  /** The small line above the title, such as "15:30 · Bible study". */
  eyebrow: string;
  /** Opens the gathering; without it the item is plain text. */
  href?: string;
  key: string;
  /** The full status on phones and for screen readers in the grid. */
  status?: ReactNode;
  /** Read out in the grid, where only the compact status is shown. */
  statusText?: string;
  title: string;
}

/**
 * A status line under a gathering. Words carry the meaning: `attention` adds
 * a small cream dot, `done` a check, `quiet` nothing.
 */
export function CalendarStatus({
  tone,
  children,
}: {
  tone: "attention" | "done" | "quiet";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "type-caption inline-flex items-center gap-1.5",
        tone === "attention" ? "text-foreground" : "text-muted-foreground"
      )}
    >
      {tone === "attention" ? (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-paper"
        />
      ) : null}
      {tone === "done" ? (
        <Check aria-hidden="true" className="-mr-0.5 size-3.5 shrink-0" />
      ) : null}
      {children}
    </span>
  );
}

function ItemSurface({
  item,
  className,
  children,
}: {
  item: CalendarItem;
  className: string;
  children: ReactNode;
}) {
  const classes = cn(
    className,
    item.href && "transition-colors",
    item.dimmed && "opacity-60"
  );
  return item.href ? (
    <Link className={classes} href={item.href} title={item.statusText}>
      {children}
    </Link>
  ) : (
    <div className={classes} title={item.statusText}>
      {children}
    </div>
  );
}

function MonthGrid({
  month,
  byDay,
  today,
  addHref,
}: {
  month: DateTime;
  byDay: Map<string, CalendarItem[]>;
  today: string;
  addHref?: (day: string) => string;
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
          const items = byDay.get(key) ?? [];
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
                {addHref && key >= today && items.length === 0 ? (
                  <Link
                    aria-label={`Add a schedule on ${label}`}
                    className="grid size-6 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                    href={addHref(key)}
                  >
                    <Plus aria-hidden="true" className="size-4" />
                  </Link>
                ) : null}
              </div>
              {items.map((item) => (
                <ItemSurface
                  className={cn(
                    "flex min-w-0 flex-col gap-0.5 rounded-md bg-secondary px-2 py-1.5",
                    item.href && "hover:bg-accent"
                  )}
                  item={item}
                  key={item.key}
                >
                  <span className="type-caption text-muted-foreground tabular-nums">
                    {item.eyebrow}
                  </span>
                  <span className="type-body-sm truncate">{item.title}</span>
                  {item.compactStatus}
                  {item.statusText ? (
                    <span className="sr-only">{item.statusText}</span>
                  ) : null}
                </ItemSurface>
              ))}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Narrow screens: the month's gatherings as a list with their full status. */
function MonthAgenda({ items }: { items: CalendarItem[] }) {
  return (
    <ul className="flex @2xl:hidden flex-col gap-2">
      {items.map((item) => {
        const date = DateTime.fromJSDate(item.date).setZone(ZONE);
        return (
          <li key={item.key}>
            <ItemSurface
              className={cn(
                "flex gap-4 rounded-xl bg-card p-4",
                item.href && "hover:bg-accent/40"
              )}
              item={item}
            >
              <span className="flex h-16 w-12 shrink-0 flex-col items-center justify-center self-start rounded-lg bg-secondary">
                <span className="type-caption text-muted-foreground">
                  {date.toFormat("ccc")}
                </span>
                <span className="type-body tabular-nums">{date.day}</span>
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="type-caption text-muted-foreground tabular-nums">
                  {item.eyebrow}
                </span>
                <span className="type-body-sm break-words">{item.title}</span>
                {item.status}
              </span>
            </ItemSurface>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A month of gatherings: a grid from container width `@2xl`, a list below
 * it. Callers describe each gathering's status; `addHref` links empty
 * upcoming days to a new schedule.
 */
export function MonthCalendar({
  items,
  month: monthKey,
  onMonthChange,
  summary,
  addHref,
}: {
  items: CalendarItem[];
  month: string;
  onMonthChange: (month: string) => void;
  /** The line under the month name, for the items shown. */
  summary: (shown: CalendarItem[]) => string;
  addHref?: (day: string) => string;
}) {
  const now = DateTime.now().setZone(ZONE);
  const today = now.toISODate() ?? "";
  const parsed = DateTime.fromFormat(monthKey, "yyyy-MM", { zone: ZONE });
  const month = (parsed.isValid ? parsed : now).startOf("month");
  const shown = items
    .filter((item) => monthOf(item.date) === month.toFormat("yyyy-MM"))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const byDay = new Map<string, CalendarItem[]>();
  for (const item of shown) {
    const key = localDay(item.date);
    byDay.set(key, [...(byDay.get(key) ?? []), item]);
  }
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
            {summary(shown)}
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
      <MonthGrid addHref={addHref} byDay={byDay} month={month} today={today} />
      {shown.length > 0 ? (
        <MonthAgenda items={shown} />
      ) : (
        <div className="@2xl:hidden">
          <QueryMessage>No gatherings this month.</QueryMessage>
        </div>
      )}
    </section>
  );
}
