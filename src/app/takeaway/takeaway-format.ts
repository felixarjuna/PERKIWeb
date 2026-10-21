import { DateTime } from "luxon";
import type { EventTypeEnum } from "~/lib/db/schema/schema";

/** Gatherings happen in Aachen, so dates read in its zone for everyone. */
const ZONE = "Europe/Berlin";

const BLANK_LINE = /\n\s*\n/;

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

/** Splits keypoints into paragraphs at blank lines. */
export function paragraphs(text: string) {
  return text
    .split(BLANK_LINE)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** Longest first line still read as a section title, e.g. "1. Integritas Nuh". */
const HEADING_MAX_LENGTH = 60;
/** A first line ending like a sentence or clause is prose, not a title. */
const ENDS_LIKE_PROSE = /[.,;:!?…)\]"”'’-]$/;
/** Writers sometimes type "1.  Title"; titles collapse runs of spaces. */
const SPACES = /\s+/g;
/** Titles and the sentence under them start with a capital or a number. */
const STARTS_UPPER = /^[\p{Lu}\d]/u;

/**
 * Paragraphs, with a writer's own section title split off: a short first line
 * that doesn't end like a sentence, followed by a line starting a new sentence.
 * A sentence hard-wrapped mid-way continues in lowercase, so it stays prose.
 */
export function sections(text: string) {
  return paragraphs(text).map((paragraph) => {
    const [first = "", ...rest] = paragraph.split("\n");
    const title = first.trim().replace(SPACES, " ");
    const isHeading =
      rest.length > 0 &&
      title.length <= HEADING_MAX_LENGTH &&
      STARTS_UPPER.test(title) &&
      STARTS_UPPER.test(rest[0]?.trim() ?? "") &&
      !ENDS_LIKE_PROSE.test(title);
    return isHeading
      ? { body: rest.join("\n").trim(), heading: title }
      : { body: paragraph, heading: null };
  });
}

/**
 * Adults read English non-fiction at ~238 words a minute (Brysbaert 2019).
 * Notes are mostly Indonesian, whose affixed words run longer, and are read
 * on phones, so estimate a little slower.
 */
const WORDS_PER_MINUTE = 200;

/** Estimated reading time in whole minutes, at least 1. */
export function readingMinutes(text: string) {
  const words = text.split(SPACES).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

const DIACRITICS = /\p{Diacritic}/gu;

/** Lowercase without accents, so "pelayanan" finds "Pelayanan" and "Pélayanan". */
function fold(text: string) {
  return text.normalize("NFD").replace(DIACRITICS, "").toLowerCase();
}

/** Whether every word of `query` appears somewhere in `fields`. */
export function matchesQuery(
  fields: readonly (string | null | undefined)[],
  query: string
) {
  const terms = fold(query).split(SPACES).filter(Boolean);
  if (terms.length === 0) {
    return true;
  }
  const haystack = fold(fields.filter(Boolean).join(" "));
  return terms.every((term) => haystack.includes(term));
}

/** List preview: blank lines dropped so the 3-line clamp never ends on a gap. */
export function preview(text: string) {
  return paragraphs(text).join("\n");
}
