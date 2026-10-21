import { describe, expect, it } from "vitest";
import type { Member } from "../members/member-model";
import {
  backfilledInstants,
  getCommunityOverview,
  signedUpAt,
} from "./overview-model";

/** The instant migration 0006 stamped on every existing row. */
const BACKFILL = new Date("2026-01-05T10:00:00.123Z");

const account = (
  id: string,
  createdAt: Date | null,
  profile: Partial<NonNullable<Member["profiles"]>> | null = null
): Member => ({
  profiles: profile && {
    address: null,
    bio: null,
    birthday: null,
    createdAt: null,
    id: `p-${id}`,
    location: null,
    major: null,
    nickname: null,
    phoneNumber: null,
    updatedAt: null,
    userId: id,
    ...profile,
  },
  user: {
    createdAt,
    email: null,
    id,
    image: null,
    name: id,
    role: "member",
  },
});

const complete = {
  address: "Street 1",
  birthday: new Date("1990-10-22"),
  location: "Aachen",
  major: "CS",
  phoneNumber: "+49",
};

const records = [
  account("a", BACKFILL),
  account("b", BACKFILL, {
    createdAt: new Date("2025-11-20T09:00:00Z"),
    location: "Aachen",
  }),
  account("c", BACKFILL, complete),
  account("d", new Date("2026-03-02T12:00:00Z")),
];

describe("sign-up dates", () => {
  it("treats an instant shared by several accounts as the migration backfill", () => {
    expect(backfilledInstants(records)).toEqual(new Set([BACKFILL.getTime()]));
  });

  it("uses the earliest real date of account and profile", () => {
    const backfill = backfilledInstants(records);
    expect(signedUpAt(records[0] as Member, backfill)).toBeNull();
    expect(signedUpAt(records[1] as Member, backfill)).toEqual(
      new Date("2025-11-20T09:00:00Z")
    );
    expect(signedUpAt(records[3] as Member, backfill)).toEqual(
      new Date("2026-03-02T12:00:00Z")
    );
  });
});

describe("community overview", () => {
  const overview = getCommunityOverview(records, {
    location: "",
    month: "2026-03",
    now: new Date("2026-03-15T12:00:00Z"),
    range: "6m",
  });

  it("counts new accounts by sign-up date and discloses undated ones", () => {
    expect(overview.total).toBe(4);
    expect(overview.current).toBe(1);
    expect(overview.missingDates).toBe(2);
    expect(overview.buckets.at(-1)?.members.map((m) => m.user.id)).toEqual([
      "d",
    ]);
    // November 2025 holds b's profile date; cumulative counts dated accounts.
    expect(overview.buckets.at(-1)?.cumulative).toBe(2);
    expect(overview.buckets.at(-1)?.joinedAt.d).toEqual(
      new Date("2026-03-02T12:00:00Z")
    );
  });

  it("counts the profile funnel", () => {
    expect(overview.funnel).toEqual({ accounts: 4, complete: 1, started: 2 });
  });
});
