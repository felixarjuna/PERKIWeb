import { DateTime } from "luxon";
import {
  calendarBirthday,
  type Member,
  normalizeLocation,
  validDate,
} from "../members/member-model";

export function getCommunityOverview(
  members: Member[],
  options: { now: Date; month: string; location: string; range: 6 | 12 }
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
  const countBetween = (start: DateTime, end: DateTime) =>
    registered.filter((member) => {
      const date = member.profiles.createdAt;
      return (
        date &&
        date.getTime() >= start.toMillis() &&
        date.getTime() < end.toMillis()
      );
    }).length;
  const months: {
    key: string;
    label: string;
    fullLabel: string;
    count: number;
    cumulative: number;
  }[] = [];
  for (let index = options.range - 1; index >= 0; index -= 1) {
    const start = month.minus({ months: index });
    const end = start.plus({ months: 1 });
    months.push({
      count: countBetween(start, end),
      cumulative: registered.filter(
        (member) =>
          (member.profiles.createdAt?.getTime() ?? Number.POSITIVE_INFINITY) <
          end.toMillis()
      ).length,
      fullLabel: start.toFormat("LLLL yyyy"),
      key: start.toFormat("yyyy-MM"),
      label: start.toFormat("LLL"),
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
    current: countBetween(month, month.plus({ months: 1 })),
    missingDates: scoped.length - registered.length,
    monthLabel: month.toFormat("LLLL yyyy"),
    months,
    previous: countBetween(month.minus({ months: 1 }), month),
    total: scoped.length,
  };
}
