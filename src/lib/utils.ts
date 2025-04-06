import { clsx, type ClassValue } from "clsx";
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge";
import { type RouterOutputs } from "~/utils/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateXAxes = (
  step = 0.1,
  multiplier: number,
  start: number,
  end: number,
) => {
  return Array.from(
    { length: Math.floor((end - start) / step) + 1 },
    (_, index) => {
      const scale = 2 / (3 - Math.cos(2 * index * step));
      return scale * Math.cos(index * step) * multiplier;
    },
  );
};

export const calculateYAxes = (
  step = 0.1,
  multiplier: number,
  start: number = Math.PI,
  end: number = -Math.PI,
) => {
  return Array.from(
    { length: Math.floor((end - start) / step) + 1 },
    (_, index) => {
      const scale = 2 / (3 - Math.cos(2 * index * step));
      return ((scale * Math.sin(2 * step * index)) / 2) * multiplier;
    },
  );
};

export const dateTimeFormatter = (date: string) => {
  const datetime = DateTime.fromJSDate(new Date(date));
  return datetime.toFormat("LLL dd, yyyy");
};

export const getUsernameFromName = (name: string) =>
  name?.replace(/\s/g, "").toLowerCase();

export function getNextDayOfWeek(date: Date, dayOfWeek: number) {
  const resultDate = new Date(date.getTime());
  resultDate.setDate(date.getDate() + ((dayOfWeek - date.getDay()) % 7));

  return resultDate;
}

export const countBirthdaysThisMonth = (
  profiles: RouterOutputs["profiles"]["getUserProfiles"],
) => {
  const now = DateTime.now(); // Current date (e.g., April 6, 2025)
  const currentMonth = now.month; // e.g., 4 for April

  return profiles.reduce((count, row) => {
    const birthday = row.profiles?.birthday;
    if (!birthday) return count; // Skip if no birthday

    const birthdayDt = DateTime.fromJSDate(birthday);
    if (!birthdayDt.isValid) return count; // Skip invalid dates

    return birthdayDt.month === currentMonth ? count + 1 : count;
  }, 0);
};
