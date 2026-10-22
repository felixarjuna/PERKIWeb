import { DateTime } from "luxon";
import type { EventTypeEnum } from "~/lib/db/schema/schema";
import { markdownToPlainText } from "~/lib/markdown";

/** Gatherings happen in Aachen, so dates read in its zone for everyone. */
const ZONE = "Europe/Berlin";

const SPACES = /\s+/;

const names = new Intl.ListFormat("en", { style: "long", type: "conjunction" });

export function fellowshipLabel(type: EventTypeEnum) {
  return type === "bible_study" ? "Bible study" : "Church service";
}

/** "16 Oct 2026" in the list, "Friday, 16 October 2026" on the detail page. */
export function serviceDate(date: Date, style: "short" | "long" = "short") {
  return DateTime.fromJSDate(date)
    .setZone(ZONE)
    .toFormat(style === "short" ? "d LLL yyyy" : "cccc, d LLLL yyyy");
}

/**
 * `contributors` is an untyped JSON column; keep only non-empty names.
 * Returns "Gaby, Erico and Tius", or null when nobody is credited.
 */
export function contributorNames(contributors: unknown) {
  const list = Array.isArray(contributors)
    ? contributors
        .filter((name): name is string => typeof name === "string")
        .map((name) => name.trim())
        .filter(Boolean)
    : [];
  return list.length > 0 ? names.format(list) : null;
}

/**
 * Adults read English non-fiction at ~238 words a minute (Brysbaert 2019).
 * Notes are mostly Indonesian, whose affixed words run longer, and are read
 * on phones, so estimate a little slower.
 */
const WORDS_PER_MINUTE = 200;

/** Estimated reading time of a takeaway, in whole minutes, at least 1. */
export function readingMinutes(markdown: string) {
  const words = markdownToPlainText(markdown)
    .split(SPACES)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * List preview: the Markdown's plain text, one line per paragraph or list
 * item, so the 3-line clamp never ends on a gap.
 */
export function preview(markdown: string) {
  return markdownToPlainText(markdown);
}
