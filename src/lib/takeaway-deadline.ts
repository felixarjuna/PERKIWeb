import { DateTime } from "luxon";

export const DEFAULT_TAKEAWAY_WEEKDAY = 5;
const DAYS_PER_WEEK = 7;
export const DEADLINE_WEEKDAYS = [
  { label: "Monday", value: "1" },
  { label: "Tuesday", value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday", value: "4" },
  { label: "Friday", value: "5" },
  { label: "Saturday", value: "6" },
  { label: "Sunday", value: "7" },
] as const;

/** The next selected weekday, strictly after the gathering's Aachen day. */
export function takeawayDueAt(date: Date, weekday: number): Date {
  const local = DateTime.fromJSDate(date, { zone: "Europe/Berlin" });
  const days =
    (weekday - local.weekday + DAYS_PER_WEEK) % DAYS_PER_WEEK || DAYS_PER_WEEK;
  return local.plus({ days }).endOf("day").toJSDate();
}
