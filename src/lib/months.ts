import { DateTime } from "luxon";

/** Gatherings happen in Aachen, so months follow its calendar for everyone. */
const ZONE = "Europe/Berlin";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Whether `value` is a `yyyy-MM` month key. */
export const isMonth = (value: string | null | undefined): value is string =>
  MONTH.test(value ?? "");

/** `yyyy-MM`, the Aachen month `date` falls in. */
export const monthOf = (date: Date) =>
  DateTime.fromJSDate(date).setZone(ZONE).toFormat("yyyy-MM");

/** "October 2026" for `2026-10`. */
export const monthLabel = (month: string) =>
  DateTime.fromFormat(month, "yyyy-MM", { zone: ZONE }).toFormat("LLLL yyyy");

/** The first instant of `yyyy-MM` in Aachen and of the month after it. */
export function monthRange(month: string) {
  const parsed = DateTime.fromFormat(month, "yyyy-MM", { zone: ZONE });
  const start = (
    parsed.isValid ? parsed : DateTime.now().setZone(ZONE)
  ).startOf("month");
  return {
    before: start.plus({ months: 1 }).toJSDate(),
    from: start.toJSDate(),
  };
}

/** The distinct months of `dates`, newest first. */
export const monthsOf = (dates: Date[]) =>
  [...new Set(dates.map(monthOf))].sort().reverse();
