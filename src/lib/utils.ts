import { type ClassValue, clsx } from "clsx";
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge";
import type { RouterOutputs } from "~/trpc/react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dateTimeFormatter = (date: string) => {
  const datetime = DateTime.fromJSDate(new Date(date));
  return datetime.toFormat("LLL dd, yyyy");
};

export const getUsernameFromName = (name: string) =>
  name.replace(/\s/g, "").toLowerCase();

/**
 * The given weekday (0 = Sunday … 6 = Saturday) within `date`'s Sunday–Saturday
 * week, keeping `date`'s time of day. The result can be in the past.
 */
export function getWeekdayInCurrentWeek(date: Date, dayOfWeek: number) {
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
