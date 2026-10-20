import { DateTime } from "luxon";
import type { RouterOutputs } from "~/trpc/react";

export type Member = RouterOutputs["profiles"]["getUserProfiles"][number];
export const memberSorts = [
  { label: "Name A–Z", value: "name" },
  { label: "Name Z–A", value: "name-desc" },
  { label: "Newest registration", value: "newest" },
  { label: "Oldest registration", value: "oldest" },
  { label: "Location A–Z", value: "location" },
  { label: "Birthday · calendar order", value: "birthday" },
] as const;
export type MemberSort = (typeof memberSorts)[number]["value"];
export interface MemberFilters {
  location: string;
  page: number;
  pageSize: number;
  q: string;
  sort: MemberSort;
}
export const PAGE_SIZES = [10, 25, 50];
export const DEFAULT_PAGE_SIZE = 10;
export const normalizeLocation = (location: string | null) =>
  location?.trim().toLowerCase() || "missing";
export const memberName = (member: Member) =>
  member.user?.name?.trim() || "Unnamed member";
export const validDate = (date: Date | null) =>
  date !== null && Number.isFinite(date.getTime());
export const calendarBirthday = (date: Date | null) => {
  if (!(validDate(date) && date)) {
    return null;
  }
  const value = DateTime.fromJSDate(date, { zone: "utc" });
  return { day: value.day, month: value.month };
};
export const memberDate = (date: Date | null, birthday = false) => {
  if (!(validDate(date) && date)) {
    return "Not provided";
  }
  return DateTime.fromJSDate(date, {
    zone: birthday ? "utc" : "Europe/Berlin",
  }).toFormat(birthday ? "d LLL" : "d LLL yyyy");
};

export function readMemberFilters(params: URLSearchParams): MemberFilters {
  const page = Number(params.get("page") ?? 1);
  const size = Number(params.get("pageSize") ?? DEFAULT_PAGE_SIZE);
  const sort =
    memberSorts.find((item) => item.value === params.get("sort"))?.value ??
    "name";
  return {
    location: params.get("location") ?? "",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZES.includes(size) ? size : DEFAULT_PAGE_SIZE,
    q: params.get("q") ?? "",
    sort,
  };
}

export function getMemberLocations(members: Member[]) {
  const locations = new Map<string, string>();
  for (const member of members) {
    const key = normalizeLocation(member.profiles.location);
    if (!locations.has(key)) {
      locations.set(key, member.profiles.location?.trim() || "Not provided");
    }
  }
  return [...locations]
    .map(([value, label]) => ({ label, value }))
    .sort((a, b) => {
      if (a.value === "missing") {
        return 1;
      }
      if (b.value === "missing") {
        return -1;
      }
      return a.label.localeCompare(b.label);
    });
}

function compareDates(a: Member, b: Member, sort: MemberSort) {
  const left = sort === "birthday" ? a.profiles.birthday : a.profiles.createdAt;
  const right =
    sort === "birthday" ? b.profiles.birthday : b.profiles.createdAt;
  if (!validDate(left)) {
    return validDate(right) ? 1 : 0;
  }
  if (!validDate(right)) {
    return -1;
  }
  if (!(left && right)) {
    return 0;
  }
  if (sort === "birthday") {
    const leftDate = DateTime.fromJSDate(left, { zone: "utc" });
    const rightDate = DateTime.fromJSDate(right, { zone: "utc" });
    return leftDate.month - rightDate.month || leftDate.day - rightDate.day;
  }
  return (left.getTime() - right.getTime()) * (sort === "newest" ? -1 : 1);
}

export function filterAndSortMembers(
  members: Member[],
  filters: MemberFilters
): Member[] {
  const query = filters.q.trim().toLowerCase();
  return members
    .filter(
      (member) =>
        (!filters.location ||
          normalizeLocation(member.profiles.location) === filters.location) &&
        [
          memberName(member),
          member.user?.email ?? "",
          member.profiles.phoneNumber ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
    )
    .sort((a, b) => {
      let order = 0;
      if (
        filters.sort === "birthday" ||
        filters.sort === "newest" ||
        filters.sort === "oldest"
      ) {
        order = compareDates(a, b, filters.sort);
      } else if (filters.sort === "location") {
        order = (a.profiles.location?.trim() ?? "").localeCompare(
          b.profiles.location?.trim() ?? ""
        );
      } else {
        order =
          memberName(a).localeCompare(memberName(b)) *
          (filters.sort === "name-desc" ? -1 : 1);
      }
      return order || a.profiles.id.localeCompare(b.profiles.id);
    });
}
