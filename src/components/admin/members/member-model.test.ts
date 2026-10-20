import { describe, expect, it } from "vitest";
import { getCommunityOverview } from "../overview/overview-model";
import {
  birthdayOrder,
  getMemberLocations,
  type Member,
  memberFilterParams,
  memberSearchText,
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
describe("member directory URL state", () => {
  it("reads and normalises location, sort and paging", () => {
    expect(
      readMemberFilters(
        new URLSearchParams(
          "q=ben&location=aachen,,missing,aachen&sort=birthday.desc&page=3&pageSize=25"
        )
      )
    ).toEqual({
      locations: ["aachen", "missing"],
      page: 3,
      pageSize: 25,
      q: "ben",
      sort: { desc: true, id: "birthday" },
    });
  });
  it("falls back from malformed URL filters", () => {
    for (const sort of ["bad", "name.sideways", "phone.asc"]) {
      expect(
        readMemberFilters(
          new URLSearchParams(`page=-1&pageSize=900&sort=${sort}`)
        )
      ).toMatchObject({
        page: 1,
        pageSize: 10,
        sort: { desc: false, id: "name" },
      });
    }
  });
  it("drops defaults from the URL", () => {
    expect(
      memberFilterParams({
        locations: [],
        page: 1,
        pageSize: 10,
        q: "",
        sort: { desc: false, id: "name" },
      })
    ).toEqual({ location: "", page: "", pageSize: "", q: "", sort: "" });
    expect(
      memberFilterParams({
        locations: ["aachen", "missing"],
        page: 2,
        sort: { desc: true, id: "registered" },
      })
    ).toEqual({
      location: "aachen,missing",
      page: "2",
      sort: "registered.desc",
    });
  });
  it("derives search text, calendar order and locations", () => {
    expect(memberSearchText(list[0] as Member)).toBe(
      "ben ben@test.local +49123"
    );
    expect(list.map(birthdayOrder)).toEqual([1022, 104, undefined]);
    expect(getMemberLocations(list)).toEqual([
      { label: "Aachen", value: "aachen" },
      { label: "Not provided", value: "missing" },
    ]);
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
