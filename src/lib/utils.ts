import { type ClassValue, clsx } from "clsx";
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge";
import type { RouterOutputs } from "~/trpc/react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const JUST_NOW_SECONDS = 45;

/** Relative time ("just now", "5 minutes ago"), in English like the UI copy. */
export const timeAgo = (date: Date, now = new Date()) => {
  const then = DateTime.fromJSDate(date).setLocale("en");
  const base = DateTime.fromJSDate(now);
  return Math.abs(base.diff(then, "seconds").seconds) < JUST_NOW_SECONDS
    ? "just now"
    : (then.toRelative({ base }) ?? "just now");
};

export const dateTimeFormatter = (date: string) => {
  const datetime = DateTime.fromJSDate(new Date(date));
  return datetime.toFormat("LLL dd, yyyy");
};

export const getUsernameFromName = (name: string) =>
  name.replace(/\s/g, "").toLowerCase();

export function getNextDayOfWeek(date: Date, dayOfWeek: number) {
  const resultDate = new Date(date.getTime());
  resultDate.setDate(date.getDate() + ((dayOfWeek - date.getDay()) % 7));

  return resultDate;
}

export const countBirthdaysThisMonth = (
  profiles: RouterOutputs["profiles"]["getUserProfiles"]
) => {
  const now = DateTime.now(); // Current date (e.g., April 6, 2025)
  const currentMonth = now.month; // e.g., 4 for April

  return profiles.reduce((count, row) => {
    const birthday = row.profiles?.birthday;
    if (!birthday) {
      return count; // Skip if no birthday
    }

    const birthdayDt = DateTime.fromJSDate(birthday);
    if (!birthdayDt.isValid) {
      return count; // Skip invalid dates
    }

    return birthdayDt.month === currentMonth ? count + 1 : count;
  }, 0);
};

/** method to calculate if the delta is more than one week. */
export function isMoreThanOneWeekApart(date: Date): boolean {
  const currentDate = new Date();
  const milliseconds = 7 * 24 * 60 * 60 * 1000;

  return date.getTime() - currentDate.getTime() < milliseconds;
}

/** method to calculate if the delta is more than two weeks. */
export function delta(date: Date): number {
  const currentDate = new Date();
  const timeDifference = date.getTime() - currentDate.getTime();
  const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
  return Math.max(daysDifference, 0);
}

export function toIdDate(date: Date): string {
  const datetime = DateTime.fromJSDate(date).setZone("Europe/Berlin");
  return datetime.toFormat("dd.MM.yyyy");
}

export function toIdTime(date: Date): string {
  const datetime = DateTime.fromJSDate(date).setZone("Europe/Berlin");
  return datetime.toFormat("HH:mm");
}
