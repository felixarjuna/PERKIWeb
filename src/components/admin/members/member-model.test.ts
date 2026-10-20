import { describe, expect, it } from "vitest";
import { getCommunityOverview } from "../overview/overview-model";
import {
  filterAndSortMembers,
  getMemberLocations,
  type Member,
  readMemberFilters,
} from "./member-model";

const member = (
  id: string,
  name: string,
  extra: Partial<Member["profiles"]> = {}
): Member => ({
  profiles: {
    address: null,
    bio: null,
    birthday: null,
    createdAt: null,
    id,
    location: null,
    major: null,
    phoneNumber: null,
    updatedAt: null,
    userId: id,
    ...extra,
  },
  user: { email: `${name}@test.local`, id, image: null, name },
});
const list = [
  member("b", "Ben", {
    birthday: new Date("1990-10-22"),
    createdAt: new Date("2026-09-30T22:30:00Z"),
    location: " Aachen ",
    phoneNumber: "+49123",
  }),
  member("a", "Anna", {
    birthday: new Date("2001-01-04"),
    createdAt: new Date("2026-09-01T12:00:00Z"),
    location: "aachen",
  }),
  member("c", "Cara"),
];
const defaults = readMemberFilters(new URLSearchParams());
describe("member directory", () => {
  it("searches names, email and phone and combines location filters", () => {
    expect(
      filterAndSortMembers(list, { ...defaults, q: "  BEN@TEST " }).map(
        (m) => m.profiles.id
      )
    ).toEqual(["b"]);
    expect(
      filterAndSortMembers(list, { ...defaults, location: "aachen", q: "123" })
    ).toHaveLength(1);
    expect(
      filterAndSortMembers(list, { ...defaults, location: "missing" }).map(
        (m) => m.profiles.id
      )
    ).toEqual(["c"]);
    expect(getMemberLocations(list)).toEqual([
      { label: "Aachen", value: "aachen" },
      { label: "Not provided", value: "missing" },
    ]);
  });
  it("sorts calendar birthdays and keeps missing dates last in both date directions", () => {
    expect(
      filterAndSortMembers(list, { ...defaults, sort: "birthday" }).map(
        (m) => m.profiles.id
      )
    ).toEqual(["a", "b", "c"]);
    expect(
      filterAndSortMembers(list, { ...defaults, sort: "oldest" }).map(
        (m) => m.profiles.id
      )
    ).toEqual(["a", "b", "c"]);
    expect(
      filterAndSortMembers(list, { ...defaults, sort: "newest" }).map(
        (m) => m.profiles.id
      )
    ).toEqual(["b", "a", "c"]);
    expect(
      filterAndSortMembers(
        [member("z", "Same"), member("a", "Same")],
        defaults
      ).map((m) => m.profiles.id)
    ).toEqual(["a", "z"]);
  });
  it("validates malformed URL filters", () => {
    expect(
      readMemberFilters(new URLSearchParams("page=-1&pageSize=900&sort=bad"))
    ).toMatchObject({ page: 1, pageSize: 10, sort: "name" });
  });
});
describe("community metrics", () => {
  it("uses Berlin month boundaries and includes every birthday in calendar order", () => {
    const overview = getCommunityOverview(list, {
      location: "",
      month: "2026-10",
      now: new Date("2026-10-20T12:00:00Z"),
      range: 6,
    });
    expect(overview.total).toBe(3);
    expect(overview.current).toBe(1);
    expect(overview.previous).toBe(1);
    expect(overview.missingDates).toBe(1);
    expect(overview.birthdays.map((m) => m.profiles.id)).toEqual(["b"]);
    expect(overview.months.at(-1)).toMatchObject({ count: 1, cumulative: 2 });
  });
  it("handles year rollover, missing dates and leap-day birthdays", () => {
    const data = [
      member("leap", "Leap", {
        birthday: new Date("2000-02-29"),
        createdAt: new Date("2025-12-31T23:30:00Z"),
      }),
      member("bad", "Invalid", {
        birthday: new Date("invalid"),
        createdAt: new Date("invalid"),
      }),
    ];
    expect(
      getCommunityOverview(data, {
        location: "",
        month: "2026-01",
        now: new Date("2026-01-20"),
        range: 12,
      })
    ).toMatchObject({ current: 1, missingDates: 1, previous: 0 });
    expect(
      getCommunityOverview(data, {
        location: "",
        month: "2026-02",
        now: new Date("2026-02-20"),
        range: 6,
      }).birthdays
    ).toHaveLength(1);
  });
});
