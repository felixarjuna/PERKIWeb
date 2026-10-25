"use client";

import { localDay, openSlots } from "~/lib/schedule-team";
import {
  type CalendarItem,
  CalendarStatus,
  gatheringLine,
  MonthCalendar,
} from "./month-calendar";

export interface CalendarSchedule {
  accommodation: string | null;
  cancelled: boolean;
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

const OPEN_LIST = new Intl.ListFormat("en", { type: "conjunction" });

/** A stored schedule on the calendar, with its open slots if it's upcoming. */
function toItem(schedule: CalendarSchedule, today: string): CalendarItem {
  const item = {
    date: schedule.date,
    eyebrow: gatheringLine(schedule.date, schedule.type),
    href: `/admin/schedules/${schedule.id}/edit`,
    key: String(schedule.id),
    title: schedule.title,
  };
  if (schedule.cancelled) {
    // Called off: nothing to fill, but planners still see the date is taken.
    const cancelled = <CalendarStatus tone="quiet">Cancelled</CalendarStatus>;
    return {
      ...item,
      compactStatus: cancelled,
      dimmed: true,
      status: cancelled,
    };
  }
  if (localDay(schedule.date) < today) {
    return { ...item, dimmed: true };
  }
  const open = openSlots(schedule);
  if (open.length === 0) {
    const done = <CalendarStatus tone="done">Team complete</CalendarStatus>;
    return { ...item, compactStatus: done, status: done };
  }
  return {
    ...item,
    compactStatus: (
      <CalendarStatus tone="attention">{open.length} open</CalendarStatus>
    ),
    status: (
      <CalendarStatus tone="attention">
        Needs {OPEN_LIST.format(open.map((slot) => slot.toLowerCase()))}
      </CalendarStatus>
    ),
    statusText: `Open: ${open.join(", ")}`,
  };
}

/**
 * Stored gatherings for planning: each upcoming one shows its open slots,
 * and an empty upcoming day links to "Add schedule".
 */
export default function ScheduleCalendar({
  schedules,
  month,
  onMonthChange,
}: {
  schedules: CalendarSchedule[];
  month: string;
  onMonthChange: (month: string) => void;
}) {
  const today = localDay(new Date());
  const open = new Map(
    schedules.map((schedule) => [
      String(schedule.id),
      localDay(schedule.date) >= today ? openSlots(schedule).length : 0,
    ])
  );
  return (
    <MonthCalendar
      addHref={(day) => `/admin/schedules/new?date=${day}`}
      items={schedules.map((schedule) => toItem(schedule, today))}
      month={month}
      onMonthChange={onMonthChange}
      summary={(shown) => {
        const slots = shown.reduce(
          (sum, item) => sum + (open.get(item.key) ?? 0),
          0
        );
        const gatherings =
          shown.length === 1 ? "1 gathering" : `${shown.length} gatherings`;
        return slots > 0
          ? `${gatherings} · ${slots} open ${slots === 1 ? "slot" : "slots"}`
          : gatherings;
      }}
    />
  );
}
