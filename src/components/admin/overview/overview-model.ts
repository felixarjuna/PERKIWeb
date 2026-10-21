import { DateTime } from "luxon";
import { profileCompletion } from "~/lib/profile-completion";
import {
  calendarBirthday,
  type Member,
  normalizeLocation,
  validDate,
} from "../members/member-model";

/** Chart ranges; longer ranges group registrations into coarser buckets. */
export const OVERVIEW_RANGES = {
  "1y": { count: 12, unit: "month" },
  "2y": { count: 8, unit: "quarter" },
  "5y": { count: 5, unit: "year" },
  "6m": { count: 6, unit: "month" },
} as const;
export type OverviewRange = keyof typeof OVERVIEW_RANGES;
type BucketUnit = (typeof OVERVIEW_RANGES)[OverviewRange]["unit"];

export interface RegistrationBucket {
  count: number;
  cumulative: number;
  end: Date;
  /** "June 2026", "Q3 2025", "2024". */
  fullLabel: string;
  /** When each member in this bucket joined, by account id. */
  joinedAt: Record<string, Date>;
  key: string;
  /** Axis label: "Jun", "Q3 ’25", "2024". */
  label: string;
  /** Members who joined inside this bucket, newest first. */
  members: Member[];
  /** Narrow-screen axis label: "J", "Q3", "’24". */
  shortLabel: string;
  start: Date;
}

function bucketLabels(start: DateTime, unit: BucketUnit) {
  if (unit === "quarter") {
    return {
      fullLabel: `Q${start.quarter} ${start.year}`,
      key: `${start.year}-Q${start.quarter}`,
      label: `Q${start.quarter} ’${start.toFormat("yy")}`,
      shortLabel: `Q${start.quarter}`,
    };
  }
  if (unit === "year") {
    return {
      fullLabel: String(start.year),
      key: String(start.year),
      label: String(start.year),
      shortLabel: `’${start.toFormat("yy")}`,
    };
  }
  return {
    fullLabel: start.toFormat("LLLL yyyy"),
    key: start.toFormat("yyyy-MM"),
    label: start.toFormat("LLL"),
    shortLabel: start.toFormat("LLL").slice(0, 1),
  };
}

const timeOf = (date: Date | null | undefined) =>
  date && validDate(date) ? date.getTime() : null;

/**
 * Instants shared by two or more accounts (or two or more profiles). Real
 * sign-ups never land on the same millisecond; migration 0006 stamped one
 * `now()` on every row that existed then, so those dates are unknown.
 */
export function backfilledInstants(members: Member[]): Set<number> {
  const backfill = new Set<number>();
  for (const column of [
    members.map((member) => timeOf(member.user.createdAt)),
    members.map((member) => timeOf(member.profiles?.createdAt)),
  ]) {
    const seen = new Set<number>();
    for (const time of column) {
      if (time === null) {
        continue;
      }
      if (seen.has(time)) {
        backfill.add(time);
      }
      seen.add(time);
    }
  }
  return backfill;
}

/** When someone joined: the earliest real date of account and profile. */
export function signedUpAt(member: Member, backfill: Set<number>): Date | null {
  const times = [
    timeOf(member.user.createdAt),
    timeOf(member.profiles?.createdAt),
  ].filter((time): time is number => time !== null && !backfill.has(time));
  return times.length ? new Date(Math.min(...times)) : null;
}

export function getCommunityOverview(
  members: Member[],
  options: { now: Date; month: string; location: string; range: OverviewRange }
) {
  const today = DateTime.fromJSDate(options.now, { zone: "Europe/Berlin" });
  const parsed = DateTime.fromFormat(options.month, "yyyy-MM", {
    zone: "Europe/Berlin",
  });
  const month = (parsed.isValid ? parsed : today).startOf("month");
  const scoped = members.filter(
    (member) =>
      !options.location ||
      normalizeLocation(member.profiles?.location ?? null) === options.location
  );
  const backfill = backfilledInstants(members);
  const registered = scoped
    .map((member) => ({
      member,
      time: signedUpAt(member, backfill)?.getTime(),
    }))
    .filter(
      (entry): entry is { member: Member; time: number } =>
        entry.time !== undefined
    );
  const joinedBetween = (start: DateTime, end: DateTime) =>
    registered
      .filter(({ time }) => time >= start.toMillis() && time < end.toMillis())
      .sort((a, b) => b.time - a.time);
  const registeredBetween = (start: DateTime, end: DateTime) =>
    joinedBetween(start, end).map(({ member }) => member);
  const { count, unit } = OVERVIEW_RANGES[options.range];
  // The last bucket always contains the selected month.
  const anchor = month.startOf(unit);
  const buckets: RegistrationBucket[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const start = anchor.minus({ [`${unit}s`]: index });
    const end = start.plus({ [`${unit}s`]: 1 });
    const joined = joinedBetween(start, end);
    const inBucket = joined.map(({ member }) => member);
    buckets.push({
      ...bucketLabels(start, unit),
      count: inBucket.length,
      cumulative: registered.filter(({ time }) => time < end.toMillis()).length,
      end: end.toJSDate(),
      joinedAt: Object.fromEntries(
        joined.map(({ member, time }) => [member.user.id, new Date(time)])
      ),
      members: inBucket,
      start: start.toJSDate(),
    });
  }
  return {
    birthdays: scoped
      .filter(
        (member) =>
          calendarBirthday(member.profiles?.birthday ?? null)?.month ===
          month.month
      )
      .sort(
        (a, b) =>
          (calendarBirthday(a.profiles?.birthday ?? null)?.day ?? 0) -
            (calendarBirthday(b.profiles?.birthday ?? null)?.day ?? 0) ||
          a.user.id.localeCompare(b.user.id)
      ),
    buckets,
    current: registeredBetween(month, month.plus({ months: 1 })).length,
    funnel: {
      accounts: scoped.length,
      complete: scoped.filter(
        (member) => profileCompletion(member.profiles).state === "complete"
      ).length,
      started: scoped.filter((member) => member.profiles !== null).length,
    },
    missingDates: scoped.length - registered.length,
    monthLabel: month.toFormat("LLLL yyyy"),
    previous: registeredBetween(month.minus({ months: 1 }), month).length,
    previousLabel: month.minus({ months: 1 }).toFormat("LLL"),
    shortMonthLabel: month.toFormat("LLL"),
    total: scoped.length,
    unit,
  };
}
