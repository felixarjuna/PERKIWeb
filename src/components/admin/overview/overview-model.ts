import { DateTime } from "luxon";
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
  key: string;
  /** Axis label: "Jun", "Q3 ’25", "2024". */
  label: string;
  /** Members who registered inside this bucket, newest first. */
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
      normalizeLocation(member.profiles.location) === options.location
  );
  const registered = scoped.filter((member) =>
    validDate(member.profiles.createdAt)
  );
  const registeredBetween = (start: DateTime, end: DateTime) =>
    registered
      .filter((member) => {
        const date = member.profiles.createdAt;
        return (
          date &&
          date.getTime() >= start.toMillis() &&
          date.getTime() < end.toMillis()
        );
      })
      .sort(
        (a, b) =>
          (b.profiles.createdAt?.getTime() ?? 0) -
          (a.profiles.createdAt?.getTime() ?? 0)
      );
  const { count, unit } = OVERVIEW_RANGES[options.range];
  // The last bucket always contains the selected month.
  const anchor = month.startOf(unit);
  const buckets: RegistrationBucket[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const start = anchor.minus({ [`${unit}s`]: index });
    const end = start.plus({ [`${unit}s`]: 1 });
    const inBucket = registeredBetween(start, end);
    buckets.push({
      ...bucketLabels(start, unit),
      count: inBucket.length,
      cumulative: registered.filter(
        (member) =>
          (member.profiles.createdAt?.getTime() ?? Number.POSITIVE_INFINITY) <
          end.toMillis()
      ).length,
      end: end.toJSDate(),
      members: inBucket,
      start: start.toJSDate(),
    });
  }
  return {
    birthdays: scoped
      .filter(
        (member) =>
          calendarBirthday(member.profiles.birthday)?.month === month.month
      )
      .sort(
        (a, b) =>
          (calendarBirthday(a.profiles.birthday)?.day ?? 0) -
            (calendarBirthday(b.profiles.birthday)?.day ?? 0) ||
          a.profiles.id.localeCompare(b.profiles.id)
      ),
    buckets,
    current: registeredBetween(month, month.plus({ months: 1 })).length,
    missingDates: scoped.length - registered.length,
    monthLabel: month.toFormat("LLLL yyyy"),
    previous: registeredBetween(month.minus({ months: 1 }), month).length,
    previousLabel: month.minus({ months: 1 }).toFormat("LLL"),
    shortMonthLabel: month.toFormat("LLL"),
    total: scoped.length,
    unit,
  };
}
