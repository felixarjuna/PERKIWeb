import { type Duty, dutyLabel } from "./duties";
import type { ScheduleFlag } from "./schedule-flags";

/** Where gatherings happen unless they're online. */
export const CHURCH_ADDRESS = "Roermonderstraße 110, 52072 Aachen";

/** Gatherings have no stored end; this covers the gathering and dinner. */
const GATHERING_HOURS = 3;
const HOUR = 3_600_000;

/** Calendar apps check the feed about this often. */
const REFRESH = "PT6H";

/** The secret part of a feed link: 32 random bytes, base64url. */
const FEED_TOKEN = /^[\w-]{43}$/;

export const isFeedToken = (value: string) => FEED_TOKEN.test(value);

const TYPE_LABELS = {
  bible_study: "Bible study",
  church_service: "Service",
} as const;

/** A gathering and the member's part at it, as `loadDuties` returns it. */
export interface CalendarDay {
  cancelled: boolean;
  date: Date;
  duties: Duty[];
  flags: ScheduleFlag[];
  id: number;
  title: string;
  type: keyof typeof TYPE_LABELS;
}

/** Text values escape backslashes, separators and line breaks (RFC 5545 3.3.11). */
export const escapeText = (value: string) =>
  value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll(/\r?\n/g, "\\n");

/** ISO punctuation and milliseconds, which iCalendar dates leave out. */
const ISO_PUNCTUATION = /[-:]|\.\d{3}/g;

const encoder = new TextEncoder();
const LINE_OCTETS = 75;

/** Folds a content line at 75 octets, never inside a character (RFC 5545 3.1). */
export function foldLine(line: string) {
  const parts: string[] = [];
  let current = "";
  let octets = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    // Continuation lines start with a space, which counts toward their 75.
    const limit = parts.length === 0 ? LINE_OCTETS : LINE_OCTETS - 1;
    if (octets + size > limit) {
      parts.push(current);
      current = "";
      octets = 0;
    }
    current += char;
    octets += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** `20261031T143000Z` */
const utc = (date: Date) => date.toISOString().replaceAll(ISO_PUNCTUATION, "");

function event(day: CalendarDay, origin: string, stamp: string) {
  const parts = day.duties.map(dutyLabel).join(", ");
  const end = new Date(day.date.getTime() + GATHERING_HOURS * HOUR);
  return [
    "BEGIN:VEVENT",
    `UID:duty-${day.id}@perki-aachen`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${utc(day.date)}`,
    `DTEND:${utc(end)}`,
    `SUMMARY:${escapeText(`${parts} · ${TYPE_LABELS[day.type]}`)}`,
    `DESCRIPTION:${escapeText(day.title)}`,
    `LOCATION:${escapeText(day.flags.includes("online") ? "Online" : CHURCH_ADDRESS)}`,
    `URL:${origin}/schedule/${day.id}`,
    "END:VEVENT",
  ];
}

/**
 * A member's duties as an iCalendar feed: one event per gathering, at its
 * start time, naming only the member's own part. Cancelled gatherings are
 * left out.
 */
export function dutyCalendar(
  days: CalendarDay[],
  { now, origin }: { now: Date; origin: string }
) {
  const stamp = utc(now);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PERKI Aachen//Duties//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:PERKI duties",
    "X-WR-TIMEZONE:Europe/Berlin",
    `REFRESH-INTERVAL;VALUE=DURATION:${REFRESH}`,
    `X-PUBLISHED-TTL:${REFRESH}`,
    ...days
      .filter((day) => !day.cancelled)
      .flatMap((day) => event(day, origin, stamp)),
    "END:VCALENDAR",
  ];
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
