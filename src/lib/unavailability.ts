import { DateTime } from "luxon";
import { nameKey } from "./people";

/** Gatherings happen in Aachen, so days are Aachen calendar days. */
const ZONE = "Europe/Berlin";

/** The longest stretch one entry may cover; longer means a pause, which mita set. */
export const MAX_UNAVAILABLE_DAYS = 92;
/** The longest note a member can leave for mita. */
export const MAX_UNAVAILABLE_NOTE = 300;

/** Days a member can't serve, both ends included, as `yyyy-MM-dd`. */
export interface DayRange {
  endsOn: string;
  startsOn: string;
}

/** Whether a day (`yyyy-MM-dd`) falls in one of the ranges. */
export const unavailableOn = (ranges: readonly DayRange[], day: string) =>
  ranges.some((range) => range.startsOn <= day && day <= range.endsOn);

const parse = (day: string) => DateTime.fromISO(day, { zone: ZONE });

/** Why a range can't be saved, as a message for the member, or null. */
export function rangeProblem(range: DayRange, today: string): string | null {
  const start = parse(range.startsOn);
  const end = parse(range.endsOn);
  if (!(start.isValid && end.isValid)) {
    return "Pick the days you can't serve.";
  }
  if (range.endsOn < range.startsOn) {
    return "The last day comes before the first.";
  }
  if (range.endsOn < today) {
    return "Those days have already passed.";
  }
  if (end.diff(start, "days").days + 1 > MAX_UNAVAILABLE_DAYS) {
    return `Mark at most ${MAX_UNAVAILABLE_DAYS} days at once. For longer, ask a mita to pause you.`;
  }
  return null;
}

/** "Sat 31 Oct", or "Sat 31 Oct – Sun 8 Nov" for several days. */
export function rangeLabel(range: DayRange) {
  const day = (value: string) => parse(value).toFormat("ccc d LLL");
  return range.startsOn === range.endsOn
    ? day(range.startsOn)
    : `${day(range.startsOn)} – ${day(range.endsOn)}`;
}

/** Someone who can't serve on a day, with every spelling the schedule may use. */
export interface AwayPerson {
  name: string;
  names: string[];
  note: string | null;
}

/** Finds who a written slot name belongs to among those away that day. */
export function awayLookup<T extends AwayPerson>(people: readonly T[]) {
  const byKey = new Map<string, T>();
  for (const person of people) {
    for (const name of person.names) {
      byKey.set(nameKey(name), person);
    }
  }
  return (name: unknown) =>
    typeof name === "string" && name.trim() !== ""
      ? byKey.get(nameKey(name))
      : undefined;
}
