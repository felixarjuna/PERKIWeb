import { Settings } from "luxon";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RouterOutputs } from "~/trpc/react";
import {
  cn,
  countBirthdaysThisMonth,
  dateTimeFormatter,
  getUsernameFromName,
  timeAgo,
} from "./utils";

type ProfileRow = RouterOutputs["profiles"]["members"][number];

/** Builds a minimal members row; only `birthday` matters here. */
const row = (birthday: Date | null): ProfileRow => ({
  profiles: {
    address: null,
    bio: null,
    birthday,
    createdAt: null,
    id: crypto.randomUUID(),
    location: null,
    major: null,
    nickname: null,
    phoneNumber: null,
    updatedAt: null,
    userId: "user",
  },
  user: {
    createdAt: null,
    email: null,
    id: "user",
    image: null,
    name: null,
    role: "member",
  },
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
});

describe("timeAgo", () => {
  const now = new Date("2026-10-20T12:00:00Z");
  it("says just now for the last few seconds, then relative time", () => {
    expect(timeAgo(new Date("2026-10-20T11:59:50Z"), now)).toBe("just now");
    expect(timeAgo(new Date("2026-10-20T11:55:00Z"), now)).toBe(
      "5 minutes ago"
    );
    expect(timeAgo(new Date("2026-10-18T12:00:00Z"), now)).toBe("2 days ago");
  });
});
