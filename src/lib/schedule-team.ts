import { DateTime } from "luxon";
import type { PoolRole, PoolScope, PoolStatus } from "./serving-pool";
import { type ServingRole, servingRoleLabels } from "./serving-roles";

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

/**
 * The Sunday-to-Saturday week around `now` in Aachen, as whole days:
 * `from` is Sunday 00:00 and `before` the next Sunday 00:00.
 */
export function weekOf(now: Date) {
  const today = DateTime.fromJSDate(now).setZone(ZONE).startOf("day");
  // Luxon numbers Monday 1 to Sunday 7, so Sunday is 0 days into the week.
  const sunday = today.minus({ days: today.weekday % 7 });
  return {
    before: sunday.plus({ weeks: 1 }).toJSDate(),
    from: sunday.toJSDate(),
  };
}

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
  cancelled?: boolean;
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

/** The slots of a schedule nobody has taken yet, by label; none once it's cancelled. */
export const openSlots = (schedule: ScheduleNeeds): string[] =>
  schedule.cancelled
    ? []
    : NEEDED[schedule.type].flatMap(([label, column]) =>
        filled(schedule[column] as string | null | undefined) ? [] : [label]
      );

/** The schedule column a role fills on a type of gathering. */
type SlotColumn =
  | "accommodation"
  | "leader"
  | "multimedia"
  | "musician"
  | "noteWriter";

/**
 * The column a member taking a slot in `role` writes, or null when that kind
 * of gathering has no such slot (a service has a liturgist, a Bible study a
 * leader; multimedia and accommodation serve at services only).
 */
export function slotColumn(
  role: ServingRole,
  type: ScheduleSlots["type"]
): SlotColumn | null {
  const service = type === "church_service";
  switch (role) {
    case "liturgist":
      return service ? "leader" : null;
    case "leader":
      return service ? null : "leader";
    case "musician":
      return "musician";
    case "note_writer":
      return "noteWriter";
    case "multimedia":
    case "accommodation":
      return service ? role : null;
    default:
      return null;
  }
}

/** The name in a slot column, or null when it's open. */
export const slotHolder = (name: string | null | undefined) => filled(name);

/** Whether a gathering is cancelled (#107): nobody serves, so no slot is open. */
export const isCancelled = (schedule: { cancelled?: boolean }) =>
  schedule.cancelled === true;

/** Everything the hard rules need to decide whether a member may take a slot. */
export interface TakeCheck {
  cancelled: boolean;
  /** The member's group cooks at this gathering. */
  cooksThatDay: boolean;
  /** The gathering's Aachen day, `yyyy-MM-dd`. */
  day: string;
  /** The member's pool entry for this role, if any. */
  entry?: { pausedUntil: string | null; scope: PoolScope; status: PoolStatus };
  /** Who is in the slot now, or null when it's open. */
  holder: string | null;
  /** The slot's holder is this member. */
  mine: boolean;
  role: PoolRole;
  /** Today in Aachen, `yyyy-MM-dd`. */
  today: string;
  type: ScheduleSlots["type"];
  /** The member marked this day as one they can't serve (#110). */
  unavailable?: boolean;
}

const SCOPE_ONLY: Record<ScheduleSlots["type"], string> = {
  bible_study: "Bible studies",
  church_service: "services",
};

const GATHERING: Record<ScheduleSlots["type"], string> = {
  bible_study: "A Bible study",
  church_service: "A service",
};

/** Roles a member whose group cooks that day may not take. */
const NOT_WHILE_COOKING: readonly ServingRole[] = ["liturgist", "musician"];

const roleName = (role: ServingRole) => servingRoleLabels[role].toLowerCase();

const shortDay = (day: string) =>
  DateTime.fromISO(day, { zone: ZONE }).toFormat("d LLL");

/**
 * Why a member may not take a slot, as a message for them, or null when they
 * may. A member takes an open slot only in a role they're active in, with the
 * gathering in their scope, not paused that day, and (for liturgist and
 * musician) not while their group cooks, on a day they haven't marked as
 * unavailable.
 */
export function takeRefusal(check: TakeCheck): string | null {
  const role = roleName(check.role);
  if (check.cancelled) {
    return "This gathering is cancelled.";
  }
  if (check.day < check.today) {
    return "This gathering has already happened.";
  }
  if (!slotColumn(check.role, check.type)) {
    return `${GATHERING[check.type]} has no ${role} slot.`;
  }
  if (check.mine) {
    return "You're already in this slot.";
  }
  if (check.holder) {
    return `${check.holder} has already taken this slot.`;
  }
  const { entry } = check;
  if (!entry) {
    return `You're not in the serving pool as ${role}. Ask a mita to add you.`;
  }
  if (entry.status !== "active") {
    return `You're a backup ${role}, so a mita fills this slot for you.`;
  }
  if (entry.scope !== "both" && entry.scope !== check.type) {
    return `You serve as ${role} at ${SCOPE_ONLY[entry.scope]} only.`;
  }
  if (entry.pausedUntil && entry.pausedUntil >= check.day) {
    return `You're paused until ${shortDay(entry.pausedUntil)}, so you can't take this slot.`;
  }
  if (check.unavailable) {
    return "You marked this day as one you can't serve.";
  }
  if (check.cooksThatDay && NOT_WHILE_COOKING.includes(check.role)) {
    return `Your group cooks that day, so you can't serve as ${role} too.`;
  }
  return null;
}

const ROLE_LIST = new Intl.ListFormat("en", { type: "conjunction" });

/** A second slot on one day is allowed (the sheet allows it), with a warning. */
export const sameDayWarning = (serving: readonly ServingRole[]) =>
  serving.length > 0
    ? `You already serve as ${ROLE_LIST.format(serving.map(roleName))} that day.`
    : null;
