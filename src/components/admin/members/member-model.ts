import { DateTime } from "luxon";
import type { RouterOutputs } from "~/trpc/react";

export type Member = RouterOutputs["profiles"]["getUserProfiles"][number];
/** Sortable table columns; the URL stores `sort=<column>.<asc|desc>`. */
export const memberSortColumns = [
  "name",
  "location",
  "birthday",
  "registered",
  "major",
] as const;
export type MemberSortColumn = (typeof memberSortColumns)[number];
export interface MemberFilters {
  /** Normalised location keys (see `normalizeLocation`). */
  locations: string[];
  page: number;
  pageSize: number;
  q: string;
  sort: { desc: boolean; id: MemberSortColumn };
}
export const PAGE_SIZES = [10, 25, 50, 100] as const;
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

const DEFAULT_SORT: MemberFilters["sort"] = { desc: false, id: "name" };
const SORT_DIRECTIONS = new Set(["asc", "desc"]);

function readSort(value: string | null): MemberFilters["sort"] {
  const [id, direction = "asc"] = (value ?? "").split(".");
  const column = memberSortColumns.find((item) => item === id);
  if (!(column && SORT_DIRECTIONS.has(direction))) {
    return DEFAULT_SORT;
  }
  return { desc: direction === "desc", id: column };
}

export function readMemberFilters(params: URLSearchParams): MemberFilters {
  const page = Number(params.get("page") ?? 1);
  const size = Number(params.get("pageSize") ?? DEFAULT_PAGE_SIZE);
  return {
    locations: [
      ...new Set(
        (params.get("location") ?? "")
          .split(",")
          .map((location) => location.trim())
          .filter(Boolean)
      ),
    ],
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZES.find((item) => item === size) ?? DEFAULT_PAGE_SIZE,
    q: params.get("q") ?? "",
    sort: readSort(params.get("sort")),
  };
}

/** URL values for `filters`; defaults become "" so they drop out of the URL. */
export function memberFilterParams(
  filters: Partial<MemberFilters>
): Record<string, string> {
  const values: Record<string, string> = {};
  if (filters.q !== undefined) {
    values.q = filters.q;
  }
  if (filters.locations) {
    values.location = filters.locations.join(",");
  }
  if (filters.sort) {
    const { desc, id } = filters.sort;
    values.sort =
      id === DEFAULT_SORT.id && desc === DEFAULT_SORT.desc
        ? ""
        : `${id}.${desc ? "desc" : "asc"}`;
  }
  if (filters.page !== undefined) {
    values.page = filters.page > 1 ? String(filters.page) : "";
  }
  if (filters.pageSize !== undefined) {
    values.pageSize =
      filters.pageSize === DEFAULT_PAGE_SIZE ? "" : String(filters.pageSize);
  }
  return values;
}

/** Lower-cased text the directory search matches against. */
export const memberSearchText = (member: Member) =>
  [memberName(member), member.user?.email, member.profiles.phoneNumber]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

/** Calendar position (MMDD) so birthdays sort Jan→Dec regardless of year. */
export const birthdayOrder = (member: Member) => {
  const birthday = calendarBirthday(member.profiles.birthday);
  return birthday ? birthday.month * 100 + birthday.day : undefined;
};

export const registeredTime = (member: Member) => {
  const date = member.profiles.createdAt;
  return validDate(date) && date ? date.getTime() : undefined;
};

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
