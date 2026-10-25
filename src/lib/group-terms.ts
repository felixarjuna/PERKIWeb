import { DateTime } from "luxon";
import { termOn } from "./schedule-team";

/**
 * A term in force today is current (still editable: people move mid-term),
 * one that has been replaced is past (read-only), one that hasn't started is
 * upcoming. Days are ISO dates in Aachen.
 */
export type TermStatus = "current" | "past" | "upcoming";

/** Schedules name their group as text, so the names stay "Group 1" … "Group 6". */
export const DEFAULT_GROUP_NAMES = Array.from(
  { length: 6 },
  (_, index) => `Group ${index + 1}`
);

export function termStatus(
  terms: { startsOn: string }[],
  term: { startsOn: string },
  today: string
): TermStatus {
  if (term.startsOn > today) {
    return "upcoming";
  }
  return termOn(terms, today)?.startsOn === term.startsOn ? "current" : "past";
}

/** Why a new term can't start on `startsOn`, or null when it can. */
export function mayStartTermOn(
  terms: { startsOn: string }[],
  startsOn: string,
  today: string
): string | null {
  if (startsOn <= today) {
    return "A new term has to start after today.";
  }
  if (terms.some((term) => term.startsOn === startsOn)) {
    return "A term already starts on that day.";
  }
  return null;
}

/** The suggested start of a new term: the first day of next month. */
export const nextTermStart = (today: string) =>
  DateTime.fromISO(today).plus({ months: 1 }).startOf("month").toISODate() ??
  "";
