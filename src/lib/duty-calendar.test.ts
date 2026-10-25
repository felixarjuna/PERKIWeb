import { describe, expect, it } from "vitest";
import {
  CHURCH_ADDRESS,
  dutyCalendar,
  escapeText,
  foldLine,
  isFeedToken,
} from "./duty-calendar";

const now = new Date("2026-10-25T10:00:00Z");

const day = (
  overrides: Partial<Parameters<typeof dutyCalendar>[0][number]> = {}
) => ({
  cancelled: false,
  date: new Date("2026-10-31T14:30:00Z"),
  duties: [{ role: "musician" as const }],
  flags: [],
  id: 7,
  title: "Gathering",
  type: "church_service" as const,
  ...overrides,
});

const unfold = (ics: string) => ics.replaceAll("\r\n ", "");

describe("dutyCalendar", () => {
  it("is a calendar with CRLF line ends and one event per gathering", () => {
    const ics = dutyCalendar([day(), day({ id: 8 })], {
      now,
      origin: "https://perki.example",
    });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics.split("\r\n").every((line) => line.length <= 75)).toBe(true);
  });

  it("starts at the gathering's time, in UTC, with a stable id", () => {
    const ics = unfold(
      dutyCalendar([day()], { now, origin: "https://perki.example" })
    );
    // 15:30 in Aachen on 31 Oct 2026 (CET) is 14:30 UTC.
    expect(ics).toContain("DTSTART:20261031T143000Z");
    expect(ics).toContain("DTEND:20261031T173000Z");
    expect(ics).toContain("UID:duty-7@perki-aachen");
    expect(ics).toContain("DTSTAMP:20261025T100000Z");
  });

  it("names the member's part, the place and the gathering's page", () => {
    const ics = unfold(
      dutyCalendar(
        [
          day({
            duties: [
              { role: "musician" },
              { group: "Group 3", role: "cooking" },
            ],
          }),
        ],
        { now, origin: "https://perki.example" }
      )
    );
    expect(ics).toContain("SUMMARY:Musician\\, Cooking · Group 3 · Service");
    expect(ics).toContain(`LOCATION:${escapeText(CHURCH_ADDRESS)}`);
    expect(ics).toContain("URL:https://perki.example/schedule/7");
    expect(ics).toContain("DESCRIPTION:Gathering");
  });

  it("puts an online gathering online", () => {
    const ics = unfold(
      dutyCalendar([day({ flags: ["online"], type: "bible_study" })], {
        now,
        origin: "https://perki.example",
      })
    );
    expect(ics).toContain("LOCATION:Online");
    expect(ics).toContain("· Bible study");
  });

  it("leaves cancelled gatherings out", () => {
    const ics = dutyCalendar([day({ cancelled: true })], {
      now,
      origin: "https://perki.example",
    });
    expect(ics).not.toContain("BEGIN:VEVENT");
  });
});

describe("escapeText", () => {
  it("escapes what iCalendar text reserves", () => {
    expect(escapeText("a\\b;c,d\ne")).toBe("a\\\\b\\;c\\,d\\ne");
  });
});

describe("foldLine", () => {
  it("folds at 75 octets without splitting a character", () => {
    const line = `SUMMARY:${"ü".repeat(60)}`;
    const folded = foldLine(line);
    const encoder = new TextEncoder();
    for (const part of folded.split("\r\n")) {
      expect(encoder.encode(part).length).toBeLessThanOrEqual(75);
    }
    expect(folded.replaceAll("\r\n ", "")).toBe(line);
  });
});

describe("isFeedToken", () => {
  it("accepts only a 43-character base64url token", () => {
    expect(isFeedToken("a".repeat(43))).toBe(true);
    expect(isFeedToken("a".repeat(42))).toBe(false);
    expect(isFeedToken(`${"a".repeat(42)}/`)).toBe(false);
  });
});
