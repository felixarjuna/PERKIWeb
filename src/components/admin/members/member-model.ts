import { DateTime } from "luxon";
import { type ProfileState, profileCompletion } from "~/lib/profile-completion";
import { ROLES } from "~/lib/roles";
import type { RouterOutputs } from "~/trpc/react";

export type Member = RouterOutputs["profiles"]["members"][number];
/** Sortable table columns; the URL stores `sort=<column>.<asc|desc>`. */
export const memberSortColumns = [
  "name",
  "location",
  "birthday",
  "registered",
  "major",
  "role",
  "profile",
] as const;
export type MemberSortColumn = (typeof memberSortColumns)[number];
export interface MemberFilters {
  /** Calendar months "1"–"12" (URL `birthday=10,11`). */
  birthdayMonths: string[];
  /** Normalised location keys (see `normalizeLocation`). */
  locations: string[];
  page: number;
  pageSize: number;
  /** Profile states (URL `profile=incomplete,not-started`). */
  profile: ProfileState[];
  q: string;
  /** Role keys from `ROLES` (URL `role=mita,writer`). */
  roles: string[];
  sort: { desc: boolean; id: MemberSortColumn };
}
export const PAGE_SIZES = [10, 25, 50, 100] as const;
/** Filter options for the birthday-month facet, January first. */
export const birthdayMonthOptions = Array.from({ length: 12 }, (_, index) => ({
  label: DateTime.fromObject({ month: index + 1 }, { locale: "en" }).toFormat(
    "LLLL"
  ),
  value: String(index + 1),
}));
/** Filter options for the profile facet. */
export const profileOptions: { label: string; value: ProfileState }[] = [
  { label: "Complete", value: "complete" },
  { label: "Incomplete", value: "incomplete" },
  { label: "Not started", value: "not-started" },
];
const PROFILE_STATES = new Set<string>(profileOptions.map((o) => o.value));
export const memberRole = (member: Member) => member.user.role;
/** Row id and the `member=` URL value. */
export const memberId = (member: Member) => member.user.id;
/** Finds a member by account id, or by the profile id older links used. */
export const findMember = (records: Member[], id: string | null) =>
  id
    ? records.find(
        (member) => member.user.id === id || member.profiles?.id === id
      )
    : undefined;
export const memberCompletion = (member: Member) =>
  profileCompletion(member.profiles);
/** Chip text for the profile column. */
export function profileLabel(member: Member) {
  const { filled, state, total } = memberCompletion(member);
  if (state === "complete") {
    return "Complete";
  }
  return state === "not-started" ? "Not started" : `${filled} of ${total}`;
}
const ROLE_KEYS = new Set<string>(ROLES);
const BIRTHDAY_MONTHS = new Set(birthdayMonthOptions.map((m) => m.value));
export const DEFAULT_PAGE_SIZE = 10;
export const normalizeLocation = (location: string | null) =>
  location?.trim().toLowerCase() || "missing";
export const memberName = (member: Member) =>
  member.user.name?.trim() || "Unnamed member";
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

/** Comma-separated URL list without blanks or duplicates. */
const readList = (value: string | null) => [
  ...new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  ),
];

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
    birthdayMonths: readList(params.get("birthday")).filter((month) =>
      BIRTHDAY_MONTHS.has(month)
    ),
    locations: readList(params.get("location")),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZES.find((item) => item === size) ?? DEFAULT_PAGE_SIZE,
    profile: readList(params.get("profile")).filter((state) =>
      PROFILE_STATES.has(state)
    ) as ProfileState[],
    q: params.get("q") ?? "",
    roles: readList(params.get("role")).filter((role) => ROLE_KEYS.has(role)),
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
  if (filters.birthdayMonths) {
    values.birthday = filters.birthdayMonths.join(",");
  }
  if (filters.locations) {
    values.location = filters.locations.join(",");
  }
  if (filters.roles) {
    values.role = filters.roles.join(",");
  }
  if (filters.profile) {
    values.profile = filters.profile.join(",");
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
  [memberName(member), member.user.email, member.profiles?.phoneNumber]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

/** Birthday month "1"–"12" for the facet filter, or undefined. */
export const birthdayMonth = (member: Member) => {
  const birthday = calendarBirthday(member.profiles?.birthday ?? null);
  return birthday ? String(birthday.month) : undefined;
};

/** Calendar position (MMDD) so birthdays sort Jan→Dec regardless of year. */
export const birthdayOrder = (member: Member) => {
  const birthday = calendarBirthday(member.profiles?.birthday ?? null);
  return birthday ? birthday.month * 100 + birthday.day : undefined;
};

export const registeredTime = (member: Member) => {
  const date = member.profiles?.createdAt ?? null;
  return validDate(date) && date ? date.getTime() : undefined;
};

export function getMemberLocations(members: Member[]) {
  const locations = new Map<string, string>();
  for (const member of members) {
    const location = member.profiles?.location ?? null;
    const key = normalizeLocation(location);
    if (!locations.has(key)) {
      locations.set(key, location?.trim() || "Not provided");
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
