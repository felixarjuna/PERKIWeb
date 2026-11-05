import { DateTime } from "luxon";
import { nameKey } from "./people";
import {
  localDay,
  type PlanCheck,
  type PlanWarning,
  planWarnings,
  slotHolder,
  startOn,
  termOn,
} from "./schedule-team";
import type { PoolRole, PoolScope, PoolStatus } from "./serving-pool";
import type { ServingRole } from "./serving-roles";

/** The schedule columns the planning grid fills, in team order. */
export const PLAN_COLUMNS = [
  "preacher",
  "leader",
  "musician",
  "multimedia",
  "accommodation",
  "noteWriter",
  "cookingGroup",
  "cleaningGroup",
] as const;
export type PlanColumn = (typeof PLAN_COLUMNS)[number];

type GatheringType = "church_service" | "bible_study";

/** Gatherings happen in Aachen, so months and days are read in its zone. */
const ZONE = "Europe/Berlin";

export const planColumnLabels: Record<PlanColumn, string> = {
  accommodation: "Accommodation",
  cleaningGroup: "Cleaning",
  cookingGroup: "Cooking",
  leader: "Liturgist / Leader",
  multimedia: "Multimedia",
  musician: "Musician",
  noteWriter: "Note writer",
  preacher: "Preacher",
};

/** A column's name on one gathering: a service has a liturgist, a Bible study a leader. */
export const columnLabel = (column: PlanColumn, type: GatheringType) => {
  if (column === "leader") {
    return type === "church_service" ? "Liturgist" : "Leader";
  }
  return planColumnLabels[column];
};

const SERVICE_ONLY: readonly PlanColumn[] = [
  "preacher",
  "multimedia",
  "accommodation",
  "cookingGroup",
];

/** Whether a kind of gathering has this slot. */
export const hasColumn = (column: PlanColumn, type: GatheringType) =>
  type === "church_service" || !SERVICE_ONLY.includes(column);

/** The serving role a person column holds on a kind of gathering; null for groups. */
export function columnRole(
  column: PlanColumn,
  type: GatheringType
): ServingRole | null {
  switch (column) {
    case "preacher":
      return "preacher";
    case "leader":
      return type === "church_service" ? "liturgist" : "leader";
    case "noteWriter":
      return "note_writer";
    case "musician":
    case "multimedia":
    case "accommodation":
      return column;
    default:
      return null;
  }
}

/** A slot the generator filled (#112): why, and whether mita kept it. */
export interface GeneratedSlot {
  /** Kept by mita: "Regenerate" leaves it alone. */
  locked?: boolean;
  reason: string;
}

export interface PlanSchedule {
  accommodation: string | null;
  cancelled: boolean;
  cleaningGroup: string | null;
  cookingGroup: string | null;
  date: Date;
  flags: string[];
  /** Slots the generator filled, by column; a manual pick drops its key. */
  generated: Record<string, GeneratedSlot>;
  id: number;
  leader: string | null;
  multimedia: string | null;
  musician: string | null;
  noteWriter: string | null;
  preacher: string | null;
  /** False for a draft only staff see (#112). */
  published: boolean;
  title: string;
  type: GatheringType;
}

/** Everything the grid needs for one month, read once by `schedules.plan`. */
export interface PlanData {
  /** The account behind each slot of the month's schedules. */
  assignments: { role: string; scheduleId: number; userId: string | null }[];
  /** Days people marked as ones they can't serve, overlapping the month. */
  away: {
    endsOn: string;
    note: string | null;
    startsOn: string;
    userId: string;
  }[];
  /** The latest day each account served (or is planned) in a role before the month. */
  before: { day: string; role: string; userId: string }[];
  /** The groups that last cooked and cleaned before the month, for the rotation. */
  lastGroups?: { cleaning: string | null; cooking: string | null };
  /** Members of the pool and anyone on the month's schedules. */
  people: {
    name: string;
    /** Every spelling the schedule may use for them. */
    names: string[];
    userId: string;
    /** How the schedule writes them: their latest slot name, else their account name. */
    writeAs: string;
  }[];
  pool: {
    pausedUntil: string | null;
    role: PoolRole;
    scope: PoolScope;
    servedThisTerm: number;
    status: PoolStatus;
    userId: string;
  }[];
  schedules: PlanSchedule[];
  speakers: string[];
  terms: {
    groups: {
      members: { name: string; userId: string | null }[];
      name: string;
    }[];
    startsOn: string;
  }[];
}

export interface PlanCell {
  /** The account in the slot, when the name belongs to one. */
  userId: string | null;
  /** The name in the slot, or null when it's open. */
  value: string | null;
  warnings: PlanWarning[];
}

export interface PlanOption {
  /** The day they last served (or are planned) in this role before this gathering. */
  lastDay: string | null;
  name: string;
  /** "Backup" or "Paused", shown beside the name. */
  note: string | null;
  servedThisTerm: number;
  userId: string;
  warnings: PlanWarning[];
}

interface Placement {
  column: PlanColumn;
  day: string;
  key: string;
  role: ServingRole;
  scheduleId: number;
}

const sameGroup = (
  a: string | null | undefined,
  b: string | null | undefined
) => Boolean(a && b) && a?.trim().toLowerCase() === b?.trim().toLowerCase();

const weekBefore = (day: string) =>
  DateTime.fromISO(day).minus({ days: 7 }).toISODate() ?? day;

const latest = (days: (string | null | undefined)[]) =>
  days.reduce<string | null>(
    (last, day) => (day && (last === null || day > last) ? day : last),
    null
  );

/**
 * Finds the account behind a written name in a slot: the assignment's link
 * first, then any spelling exactly one account goes by.
 */
export function accountResolver(
  data: Pick<PlanData, "assignments" | "people">
) {
  const byKey = new Map<string, string | null>();
  for (const person of data.people) {
    for (const name of [person.name, person.writeAs, ...person.names]) {
      const key = nameKey(name);
      // A spelling two accounts share points at neither.
      byKey.set(
        key,
        byKey.has(key) && byKey.get(key) !== person.userId
          ? null
          : person.userId
      );
    }
  }
  const linkedTo = new Map(
    data.assignments.map((row) => [`${row.scheduleId} ${row.role}`, row.userId])
  );

  return (scheduleId: number, role: ServingRole, name: string) =>
    linkedTo.get(`${scheduleId} ${role}`) ?? byKey.get(nameKey(name)) ?? null;
}

/**
 * The month's grid as cells, warnings and picker options. Pure: built from
 * `PlanData` (current cell values included), so the same rules run on the
 * server's data in tests and in the browser.
 */
export function buildPlan(data: PlanData) {
  const userFor = accountResolver(data);

  const keyFor = (userId: string | null, name: string) =>
    userId ?? `name:${nameKey(name)}`;

  const placements: Placement[] = data.schedules.flatMap((schedule) =>
    schedule.cancelled
      ? []
      : PLAN_COLUMNS.flatMap((column) => {
          const role = columnRole(column, schedule.type);
          const name = slotHolder(schedule[column]);
          if (
            !(
              role &&
              role !== "preacher" &&
              name &&
              hasColumn(column, schedule.type)
            )
          ) {
            return [];
          }
          return [
            {
              column,
              day: localDay(schedule.date),
              key: keyFor(userFor(schedule.id, role, name), name),
              role,
              scheduleId: schedule.id,
            },
          ];
        })
  );

  const lastBefore = (
    key: string,
    userId: string | null,
    role: ServingRole,
    day: string
  ) =>
    latest([
      ...placements
        .filter((p) => p.key === key && p.role === role && p.day < day)
        .map((p) => p.day),
      ...(userId
        ? data.before
            .filter((row) => row.userId === userId && row.role === role)
            .map((row) => row.day)
        : []),
    ]);

  const cooks = (
    schedule: PlanSchedule,
    userId: string | null,
    name: string
  ) => {
    const term = termOn(data.terms, localDay(schedule.date));
    const group = term?.groups.find((g) =>
      sameGroup(g.name, schedule.cookingGroup)
    );
    return Boolean(
      group?.members.some((member) =>
        userId
          ? member.userId === userId
          : nameKey(member.name) === nameKey(name)
      )
    );
  };

  /** The warnings for `name` (account `userId`) in a person slot. */
  const personWarnings = (
    schedule: PlanSchedule,
    column: PlanColumn,
    role: PoolRole,
    name: string,
    userId: string | null
  ) => {
    const day = localDay(schedule.date);
    const key = keyFor(userId, name);
    const entry = userId
      ? data.pool.find((row) => row.userId === userId && row.role === role)
      : undefined;
    const away = userId
      ? data.away.find(
          (row) =>
            row.userId === userId && row.startsOn <= day && day <= row.endsOn
        )
      : undefined;
    const last = lastBefore(key, userId, role, day);
    const check: PlanCheck = {
      alsoServing: placements
        .filter(
          (p) =>
            p.key === key &&
            p.day === day &&
            !(p.scheduleId === schedule.id && p.column === column)
        )
        .map((p) => p.role),
      cooksThatDay: cooks(schedule, userId, name),
      day,
      entry,
      kind: "person",
      linked: userId !== null,
      role,
      servedWeekBefore: last && last >= weekBefore(day) ? last : null,
      type: schedule.type,
      unavailable: away ? { note: away.note } : null,
    };
    return planWarnings(check);
  };

  /** What a slot holds now and what's wrong with it. Cancelled gatherings have no warnings. */
  function cell(schedule: PlanSchedule, column: PlanColumn): PlanCell {
    const value = slotHolder(schedule[column]);
    const role = columnRole(column, schedule.type);
    if (!value || schedule.cancelled) {
      return { userId: null, value, warnings: [] };
    }
    if (role === null) {
      return {
        userId: null,
        value,
        warnings: planWarnings({
          cleaningGroup: schedule.cleaningGroup,
          cookingGroup: schedule.cookingGroup,
          kind: "groups",
        }),
      };
    }
    if (role === "preacher") {
      return { userId: null, value, warnings: [] };
    }
    const userId = userFor(schedule.id, role, value);
    return {
      userId,
      value,
      warnings: personWarnings(schedule, column, role, value, userId),
    };
  }

  const nameOf = new Map(data.people.map((person) => [person.userId, person]));

  /**
   * The pool for a person slot: everyone in that role, those whose scope
   * includes the gathering first, each least recently served first (never
   * served before anyone), with the warnings they'd get in this slot.
   */
  function options(schedule: PlanSchedule, column: PlanColumn) {
    const role = columnRole(column, schedule.type);
    if (role === null || role === "preacher") {
      return { elsewhere: [], inScope: [] };
    }
    const day = localDay(schedule.date);
    const all = data.pool.flatMap(
      (entry): (PlanOption & { inScope: boolean })[] => {
        const person = nameOf.get(entry.userId);
        if (entry.role !== role || !person) {
          return [];
        }
        const paused = entry.pausedUntil !== null && entry.pausedUntil >= day;
        let note: string | null = null;
        if (paused) {
          note = "Paused";
        } else if (entry.status === "backup") {
          note = "Backup";
        }
        return [
          {
            inScope: entry.scope === "both" || entry.scope === schedule.type,
            lastDay: lastBefore(entry.userId, entry.userId, role, day),
            name: person.writeAs,
            note,
            servedThisTerm: entry.servedThisTerm,
            userId: entry.userId,
            warnings: personWarnings(
              schedule,
              column,
              role,
              person.writeAs,
              entry.userId
            ),
          },
        ];
      }
    );
    all.sort(
      (a, b) =>
        (a.lastDay ?? "").localeCompare(b.lastDay ?? "") ||
        a.name.localeCompare(b.name)
    );
    return {
      elsewhere: all.filter((option) => !option.inScope),
      inScope: all.filter((option) => option.inScope),
    };
  }

  /** The cooking and cleaning groups in force on the gathering's day. */
  const groupNames = (schedule: PlanSchedule) =>
    termOn(data.terms, localDay(schedule.date))?.groups.map((g) => g.name) ??
    [];

  return { cell, groupNames, options, speakers: data.speakers };
}

export type Plan = ReturnType<typeof buildPlan>;

/** Titles a gathering gets when the grid adds it, as the sheet names them. */
export const PLAN_TITLES: Record<GatheringType, string> = {
  bible_study: "Penelaahan Alkitab",
  church_service: "Kebaktian",
};

const SATURDAY = 6;

/** A gathering the regular rhythm expects on a day. */
export interface RegularGathering {
  date: Date;
  /** The Aachen day, `yyyy-MM-dd`. */
  day: string;
  title: string;
  type: GatheringType;
}

/**
 * The regular rhythm for `months` months from `from` (`yyyy-MM`): every
 * Saturday at 15:30 in Aachen, PA Besar (a Bible study) on the 1st, 3rd and
 * 5th Saturday of the month and a church service on the 2nd and 4th.
 */
export function regularGatherings(
  from: string,
  months: number
): RegularGathering[] {
  const start = DateTime.fromFormat(from, "yyyy-MM", { zone: ZONE });
  if (!start.isValid) {
    return [];
  }
  return Array.from({ length: months }, (_, index) =>
    start.plus({ months: index })
  ).flatMap((month) => {
    const offset = (SATURDAY - month.weekday + 7) % 7;
    const saturdays: RegularGathering[] = [];
    for (
      let day = month.plus({ days: offset });
      day.month === month.month;
      day = day.plus({ weeks: 1 })
    ) {
      const type: GatheringType =
        saturdays.length % 2 === 0 ? "bible_study" : "church_service";
      saturdays.push({
        date: startOn({ day: day.day, month: day.month, year: day.year }),
        day: day.toISODate() ?? "",
        title: PLAN_TITLES[type],
        type,
      });
    }
    return saturdays;
  });
}

/** A row of the grid: a stored gathering, or a regular day not added yet. */
export interface PlanRow {
  key: string;
  schedule: PlanSchedule;
  /** Not stored yet: filling a slot adds the gathering. */
  suggested: boolean;
}

/** An empty gathering for a regular day, so the grid can offer its slots. */
const suggestedSchedule = (gathering: RegularGathering): PlanSchedule => ({
  accommodation: null,
  cancelled: false,
  cleaningGroup: null,
  cookingGroup: null,
  date: gathering.date,
  flags: [],
  generated: {},
  id: 0,
  leader: null,
  multimedia: null,
  musician: null,
  noteWriter: null,
  preacher: null,
  published: false,
  title: gathering.title,
  type: gathering.type,
});

/**
 * The stored gatherings and, for every regular day without one, a suggested
 * row, in date order. A day that has any gathering (a camp, a special
 * service) gets no suggestion.
 */
export function planRows(
  schedules: PlanSchedule[],
  regular: RegularGathering[]
): PlanRow[] {
  const taken = new Set(schedules.map((schedule) => localDay(schedule.date)));
  return [
    ...schedules.map((schedule) => ({
      key: String(schedule.id),
      schedule,
      suggested: false,
    })),
    ...regular
      .filter((gathering) => !taken.has(gathering.day))
      .map((gathering) => ({
        key: `new ${gathering.day}`,
        schedule: suggestedSchedule(gathering),
        suggested: true,
      })),
  ].sort(
    (a, b) =>
      a.schedule.date.getTime() - b.schedule.date.getTime() ||
      a.schedule.id - b.schedule.id
  );
}

/** The longest stretch the grid lays out at once. */
export const MAX_PLAN_MONTHS = 12;
