import { DateTime } from "luxon";
import type { ServingRole } from "./serving-roles";

/** Gatherings happen in Aachen, so dates are read in its zone. */
const ZONE = "Europe/Berlin";

export interface Slot {
  name: string;
  role: ServingRole;
}

interface ScheduleSlots {
  accommodation?: string | null;
  leader?: string | null;
  multimedia?: string | null;
  musician?: string | null;
  noteWriter?: string | null;
  preacher?: string | null;
  type: "church_service" | "bible_study";
}

/** The sheet and the form use "-" or nothing for an empty slot. */
const filled = (name: string | null | undefined) => {
  const trimmed = name?.trim();
  return trimmed && trimmed !== "-" ? trimmed : null;
};

/**
 * Reads the filled slots from a schedule's name columns. The `leader` column
 * holds the liturgist on a service and the leader at a Bible study.
 */
export function slotsFromSchedule(schedule: ScheduleSlots): Slot[] {
  const columns: [ServingRole, string | null | undefined][] = [
    ["preacher", schedule.preacher],
    [
      schedule.type === "church_service" ? "liturgist" : "leader",
      schedule.leader,
    ],
    ["musician", schedule.musician],
    ["multimedia", schedule.multimedia],
    ["accommodation", schedule.accommodation],
    ["note_writer", schedule.noteWriter],
  ];
  return columns.flatMap(([role, name]) => {
    const value = filled(name);
    return value ? [{ name: value, role }] : [];
  });
}

/** The calendar day of a gathering in Aachen, as `yyyy-MM-dd`. */
export const localDay = (date: Date) =>
  DateTime.fromJSDate(date).setZone(ZONE).toISODate() ?? "";

/** The group term in force on a day: the latest one that started on or before it. */
export function termOn<T extends { startsOn: string }>(
  terms: T[],
  day: string
): T | undefined {
  return terms
    .filter((term) => term.startsOn <= day)
    .reduce<T | undefined>(
      (latest, term) =>
        latest === undefined || term.startsOn > latest.startsOn ? term : latest,
      undefined
    );
}
