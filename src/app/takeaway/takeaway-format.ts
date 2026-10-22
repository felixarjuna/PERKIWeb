import { DateTime } from "luxon";
import type { EventTypeEnum } from "~/lib/db/schema/schema";

/** Gatherings happen in Aachen, so dates read in its zone for everyone. */
const ZONE = "Europe/Berlin";

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
