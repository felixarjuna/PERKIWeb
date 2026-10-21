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

/** Gatherings start at 15:30 in Aachen unless a schedule says otherwise. */
export const DEFAULT_START = { hour: 15, minute: 30 } as const;

/** 15:30 in Aachen on a calendar day. */
export const startOn = (day: { day: number; month: number; year: number }) =>
  DateTime.fromObject({ ...day, ...DEFAULT_START }, { zone: ZONE }).toJSDate();

/**
 * The day picked in a calendar (the browser's local midnight) at the time of
 * `current` when it has one, otherwise at the default start, in Aachen.
 */
export function onPickedDay(picked: Date, current?: Date) {
  const day = {
    day: picked.getDate(),
    month: picked.getMonth() + 1,
    year: picked.getFullYear(),
  };
  const time = current && DateTime.fromJSDate(current).setZone(ZONE);
  if (time && time.toFormat("HH:mm") !== "00:00") {
    return DateTime.fromObject(
      { ...day, hour: time.hour, minute: time.minute },
      { zone: ZONE }
    ).toJSDate();
  }
  return startOn(day);
}

/** A stored time in Aachen as `HH:mm`; 00:00 means no time was ever set. */
export const localTime = (date: Date) =>
  DateTime.fromJSDate(date).setZone(ZONE).toFormat("HH:mm");

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

interface ScheduleNeeds extends ScheduleSlots {
  cleaningGroup?: string | null;
  cookingGroup?: string | null;
}

/** Slots every gathering of a type needs filled, in team order. */
const NEEDED = {
  bible_study: [
    ["Leader", "leader"],
    ["Musician", "musician"],
    ["Note writer", "noteWriter"],
    ["Cleaning group", "cleaningGroup"],
  ],
  church_service: [
    ["Preacher", "preacher"],
    ["Liturgist", "leader"],
    ["Musician", "musician"],
    ["Multimedia", "multimedia"],
    ["Accommodation", "accommodation"],
    ["Note writer", "noteWriter"],
    ["Cooking group", "cookingGroup"],
    ["Cleaning group", "cleaningGroup"],
  ],
} as const satisfies Record<
  ScheduleSlots["type"],
  readonly (readonly [string, keyof ScheduleNeeds])[]
>;

/** The slots of a schedule nobody has taken yet, by label. */
export const openSlots = (schedule: ScheduleNeeds): string[] =>
  NEEDED[schedule.type].flatMap(([label, column]) =>
    filled(schedule[column] as string | null | undefined) ? [] : [label]
  );
