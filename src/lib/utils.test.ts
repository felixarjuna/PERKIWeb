import { Settings } from "luxon";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RouterOutputs } from "~/trpc/react";
import {
  calculateXAxes,
  calculateYAxes,
  cn,
  countBirthdaysThisMonth,
  dateTimeFormatter,
  delta,
  getNextDayOfWeek,
  getUsernameFromName,
  isMoreThanOneWeekApart,
  toIdDate,
  toIdTime,
} from "./utils";

type ProfileRow = RouterOutputs["profiles"]["getUserProfiles"][number];

const DAY_MS = 24 * 60 * 60 * 1000;
const STEP = 0.5;
const MULTIPLIER = 10;

/** Builds a minimal getUserProfiles row; only `birthday` matters here. */
const row = (birthday: Date | null): ProfileRow => ({
  profiles: {
    address: null,
    bio: null,
    birthday,
    createdAt: null,
    id: crypto.randomUUID(),
    location: null,
    major: null,
    phoneNumber: null,
    updatedAt: null,
    userId: "user",
  },
  user: null,
});

describe("cn", () => {
  it("joins class names and drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b", { c: true, d: false })).toBe(
      "a b c"
    );
  });

  it("lets later tailwind classes win over conflicting earlier ones", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("returns an empty string without input", () => {
    expect(cn()).toBe("");
  });
});

describe("calculateXAxes / calculateYAxes", () => {
  it("produces floor((end - start) / step) + 1 points", () => {
    const xs = calculateXAxes(STEP, MULTIPLIER, -Math.PI, Math.PI);
    const ys = calculateYAxes(STEP, MULTIPLIER, -Math.PI, Math.PI);
    const expected = Math.floor((2 * Math.PI) / STEP) + 1;
    expect(xs).toHaveLength(expected);
    expect(ys).toHaveLength(expected);
  });

  it("starts the lemniscate at (multiplier, 0)", () => {
    expect(calculateXAxes(STEP, MULTIPLIER, 0, 1)[0]).toBeCloseTo(MULTIPLIER);
    expect(calculateYAxes(STEP, MULTIPLIER, 0, 1)[0]).toBeCloseTo(0);
  });

  it("matches the Bernoulli lemniscate formula for each index", () => {
    const xs = calculateXAxes(STEP, MULTIPLIER, -Math.PI, Math.PI);
    const ys = calculateYAxes(STEP, MULTIPLIER, -Math.PI, Math.PI);
    for (const [index, x] of xs.entries()) {
      const t = index * STEP;
      const scale = 2 / (3 - Math.cos(2 * t));
      expect(x).toBeCloseTo(scale * Math.cos(t) * MULTIPLIER);
      expect(ys[index]).toBeCloseTo(
        ((scale * Math.sin(2 * t)) / 2) * MULTIPLIER
      );
    }
  });

  it("stays within [-multiplier, multiplier]", () => {
    const xs = calculateXAxes(0.01, MULTIPLIER, -Math.PI, Math.PI);
    const ys = calculateYAxes(0.01, MULTIPLIER, -Math.PI, Math.PI);
    for (const value of [...xs, ...ys]) {
      expect(Math.abs(value)).toBeLessThanOrEqual(MULTIPLIER + 1e-9);
    }
  });

  it("returns no points when end is before start", () => {
    expect(calculateXAxes(STEP, MULTIPLIER, Math.PI, -Math.PI)).toEqual([]);
  });

  it("returns no points with calculateYAxes' default range (start=PI, end=-PI)", () => {
    // The defaults are reversed, so callers must always pass the range
    // explicitly (circle-background.tsx does).
    expect(calculateYAxes(STEP, MULTIPLIER)).toEqual([]);
  });
});

describe("dateTimeFormatter", () => {
  let previousLocale: string;

  beforeEach(() => {
    previousLocale = Settings.defaultLocale;
    Settings.defaultLocale = "en-US";
  });

  afterEach(() => {
    Settings.defaultLocale = previousLocale;
  });

  it("formats as 'LLL dd, yyyy'", () => {
    expect(dateTimeFormatter("2025-03-05T12:00:00Z")).toBe("Mar 05, 2025");
  });

  it("accepts Date#toString() output, as the schedule/takeaway lists pass", () => {
    const date = new Date(2024, 11, 24, 18, 0);
    expect(dateTimeFormatter(date.toString())).toBe("Dec 24, 2024");
  });

  it("renders 'Invalid DateTime' for unparseable input", () => {
    expect(dateTimeFormatter("not a date")).toBe("Invalid DateTime");
  });
});

describe("getUsernameFromName", () => {
  it("lowercases and strips all whitespace", () => {
    expect(getUsernameFromName("Felix Arjuna")).toBe("felixarjuna");
    expect(getUsernameFromName("  Anna\tMaria \n Schmidt ")).toBe(
      "annamariaschmidt"
    );
  });

  it("returns an empty string for an empty name", () => {
    expect(getUsernameFromName("")).toBe("");
  });

  it("keeps non-whitespace characters", () => {
    expect(getUsernameFromName("O'Neil-Smith Jr.")).toBe("o'neil-smithjr.");
  });
});

describe("getNextDayOfWeek", () => {
  // 2025-10-08 is a Wednesday (getDay() === 3).
  const wednesday = new Date(2025, 9, 8, 15, 30);

  it("returns the Sunday that starts the current week (in the past)", () => {
    const result = getNextDayOfWeek(wednesday, 0);
    expect(result.getDay()).toBe(0);
    expect(result.getDate()).toBe(5);
    expect(result.getHours()).toBe(15);
  });

  it("returns the Saturday that ends the current week", () => {
    const result = getNextDayOfWeek(wednesday, 6);
    expect(result.getDay()).toBe(6);
    expect(result.getDate()).toBe(11);
  });

  it("returns the same day when asked for today's weekday", () => {
    expect(getNextDayOfWeek(wednesday, 3).getTime()).toBe(wednesday.getTime());
  });

  it("crosses month boundaries", () => {
    // 2025-10-01 is a Wednesday; its Sunday is 2025-09-28.
    const result = getNextDayOfWeek(new Date(2025, 9, 1), 0);
    expect([result.getMonth(), result.getDate()]).toEqual([8, 28]);
  });

  it("does not mutate the input date", () => {
    const input = new Date(wednesday);
    getNextDayOfWeek(input, 6);
    expect(input.getTime()).toBe(wednesday.getTime());
  });
});

describe("date-relative helpers", () => {
  const now = new Date("2025-04-15T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("countBirthdaysThisMonth", () => {
    it("counts birthdays in the current month regardless of year", () => {
      const profiles = [
        row(new Date(1999, 3, 10, 12)),
        row(new Date(2001, 3, 28, 12)),
        row(new Date(1999, 4, 10, 12)),
        row(new Date(1995, 2, 15, 12)),
      ];
      expect(countBirthdaysThisMonth(profiles)).toBe(2);
    });

    it("ignores null and invalid birthdays", () => {
      const profiles = [
        row(null),
        row(new Date("garbage")),
        row(new Date(2000, 3, 1, 12)),
      ];
      expect(countBirthdaysThisMonth(profiles)).toBe(1);
    });

    it("returns 0 for no profiles", () => {
      expect(countBirthdaysThisMonth([])).toBe(0);
    });

    it("follows the system clock", () => {
      const profiles = [row(new Date(1999, 3, 10, 12))];
      expect(countBirthdaysThisMonth(profiles)).toBe(1);
      vi.setSystemTime(new Date("2025-05-15T12:00:00Z"));
      expect(countBirthdaysThisMonth(profiles)).toBe(0);
    });
  });

  describe("isMoreThanOneWeekApart", () => {
    // NOTE: despite its name this returns true when the date is LESS than a
    // week away (or already past); christmas/page.tsx relies on that to show
    // "Registration closed!".
    it("is true for dates less than a week ahead", () => {
      expect(isMoreThanOneWeekApart(new Date(now.getTime() + DAY_MS))).toBe(
        true
      );
    });

    it("is true for dates in the past", () => {
      expect(isMoreThanOneWeekApart(new Date(now.getTime() - DAY_MS))).toBe(
        true
      );
    });

    it("is false for dates exactly a week or more ahead", () => {
      expect(isMoreThanOneWeekApart(new Date(now.getTime() + 7 * DAY_MS))).toBe(
        false
      );
      expect(
        isMoreThanOneWeekApart(new Date(now.getTime() + 30 * DAY_MS))
      ).toBe(false);
    });
  });

  describe("delta", () => {
    it("returns whole days remaining, rounded up", () => {
      expect(delta(new Date(now.getTime() + 3 * DAY_MS))).toBe(3);
      expect(delta(new Date(now.getTime() + 2.1 * DAY_MS))).toBe(3);
      expect(delta(new Date(now.getTime() + 1))).toBe(1);
    });

    it("returns 0 for now and for past dates", () => {
      expect(delta(now)).toBe(0);
      expect(delta(new Date(now.getTime() - 5 * DAY_MS))).toBe(0);
    });
  });
});

describe("toIdDate / toIdTime (Europe/Berlin)", () => {
  it("formats winter time (UTC+1)", () => {
    const date = new Date("2025-12-20T17:30:00Z");
    expect(toIdDate(date)).toBe("20.12.2025");
    expect(toIdTime(date)).toBe("18:30");
  });

  it("formats summer time (UTC+2)", () => {
    const date = new Date("2025-07-01T10:05:00Z");
    expect(toIdDate(date)).toBe("01.07.2025");
    expect(toIdTime(date)).toBe("12:05");
  });

  it("rolls over to the Berlin calendar day", () => {
    const date = new Date("2025-12-31T23:30:00Z");
    expect(toIdDate(date)).toBe("01.01.2026");
    expect(toIdTime(date)).toBe("00:30");
  });
});
