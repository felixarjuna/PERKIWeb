import { DateTime } from "luxon";
import { nameKey } from "./people";
import {
  accountResolver,
  columnRole,
  hasColumn,
  PLAN_COLUMNS,
  type PlanColumn,
  type PlanData,
  type PlanRow,
  type PlanSchedule,
} from "./plan-grid";
import { localDay, slotHolder, termOn } from "./schedule-team";
import type { PoolRole } from "./serving-pool";

/**
 * At least this many days between two slots of one person in the same role,
 * so nobody gets the same job on two Saturdays in a row.
 */
export const MIN_GAP_DAYS = 14;

/** Roles a person whose group cooks that day doesn't get. */
const NOT_WHILE_COOKING: readonly PoolRole[] = ["liturgist", "musician"];

/** "fill" fills open slots; "regenerate" also refills the unlocked picks it made before. */
export type GenerateMode = "fill" | "regenerate";

export interface GeneratedPick {
  column: PlanColumn;
  name: string;
  /** Why this person or group, shown under the cell. */
  reason: string;
  /** The account picked from the pool; null for a group. */
  userId: string | null;
}

export interface GeneratedRow {
  /** Unlocked generated slots emptied before refilling. */
  cleared: PlanColumn[];
  /** Slots still open: nobody was free. */
  open: PlanColumn[];
  picks: GeneratedPick[];
  row: PlanRow;
}

/**
 * Whether the generator may write to a row: drafts and regular days not
 * added yet, from today on. Published and cancelled gatherings stay as they
 * are (mita edit published ones by hand).
 */
export const generates = (row: PlanRow, today: string) =>
  !row.schedule.cancelled &&
  (row.suggested || !row.schedule.published) &&
  localDay(row.schedule.date) >= today;

const shortDay = (day: string) => DateTime.fromISO(day).toFormat("d LLL");

const daysBetween = (a: string, b: string) =>
  Math.abs(DateTime.fromISO(a).diff(DateTime.fromISO(b), "days").days);

const sameName = (a: string | null | undefined, b: string | null | undefined) =>
  Boolean(a && b) && a?.trim().toLowerCase() === b?.trim().toLowerCase();

/** Groups in their natural order: "Group 2" before "Group 10". */
const inOrder = (names: string[]) =>
  [...names].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );

/**
 * The next group after `after` in the term's order, wrapping round, never
 * `skip` (the group with the other job that day). The first group when the
 * last one isn't in this term.
 */
function nextGroup(
  names: string[],
  after: string | null,
  skip: string | null
): string | null {
  const start = names.findIndex((name) => sameName(name, after)) + 1;
  const order = [...names.slice(start), ...names.slice(0, start)];
  return order.find((name) => !sameName(name, skip)) ?? null;
}

interface Placement {
  day: string;
  /** The account, or `name:<key>` for a name without one. */
  key: string;
  role: PoolRole;
}

/** A slot's value once "regenerate" has emptied the unlocked picks. */
function startingValue(
  row: PlanRow,
  column: PlanColumn,
  clears: boolean
): string | null {
  const generated = row.schedule.generated[column];
  if (clears && generated && generated.locked !== true) {
    return null;
  }
  return slotHolder(row.schedule[column]);
}

type Values = Record<PlanColumn, string | null>;

/** Each row's slots as the generator starts from them. */
const startingValues = (row: PlanRow, clears: boolean): Values =>
  Object.fromEntries(
    PLAN_COLUMNS.map((column) => [column, startingValue(row, column, clears)])
  ) as Values;

/** The person slots of a gathering still open, in team order. */
const openPersonSlots = (schedule: PlanSchedule, current: Values) =>
  PLAN_COLUMNS.filter((column) => {
    const role = columnRole(column, schedule.type);
    return (
      role !== null &&
      role !== "preacher" &&
      hasColumn(column, schedule.type) &&
      !current[column]
    );
  });

interface Candidate {
  backup: boolean;
  /** Slots in this role this term, served and planned. */
  count: number;
  last: string | null;
  name: string;
  userId: string;
}

/** The best of the free people, with why; null when nobody is free. */
function pickFrom(free: Candidate[]): Omit<GeneratedPick, "column"> | null {
  const active = free.filter((candidate) => !candidate.backup);
  const backup = active.length === 0;
  const [best, next] = (backup ? free : active).sort(
    (a, b) =>
      a.count - b.count ||
      (a.last ?? "").localeCompare(b.last ?? "") ||
      a.name.localeCompare(b.name) ||
      a.userId.localeCompare(b.userId)
  );
  if (!best) {
    return null;
  }
  const last = best.last ? `last on ${shortDay(best.last)}` : "not served yet";
  let reason = `Least recently served; ${last}.`;
  if (backup) {
    reason = `Backup: nobody active is free; ${last}.`;
  } else if (!next) {
    reason = `The only one free; ${last}.`;
  } else if (next.count > best.count) {
    reason = `Fewest this term (${best.count}×); ${last}.`;
  }
  return { name: best.name, reason, userId: best.userId };
}

type GroupColumn = "cookingGroup" | "cleaningGroup";

/** The group next in a rotation, with why; null when the term has none to give. */
function rotate(
  column: GroupColumn,
  groups: string[],
  after: string | null,
  skip: string | null
): GeneratedPick | null {
  const name = nextGroup(groups, after, skip);
  if (!name) {
    return null;
  }
  const job = column === "cookingGroup" ? "cooking" : "cleaning";
  let reason = groups.some((group) => sameName(group, after))
    ? `Next in the ${job} rotation after ${after}.`
    : `First in the ${job} rotation this term.`;
  if (skip && sameName(nextGroup(groups, after, null), skip)) {
    reason += ` ${skip} ${job === "cooking" ? "cleans" : "cooks"} that day.`;
  }
  return { column, name, reason, userId: null };
}

/**
 * The people rules over the plan so far: `placements` grows as the
 * generator picks, so every pick sees the ones before it.
 */
function peopleRules(data: PlanData, placements: Placement[], today: string) {
  const people = new Map(data.people.map((person) => [person.userId, person]));

  const lastBefore = (userId: string, role: PoolRole, day: string) =>
    [
      ...placements
        .filter((p) => p.key === userId && p.role === role && p.day < day)
        .map((p) => p.day),
      ...data.before
        .filter((row) => row.userId === userId && row.role === role)
        .map((row) => row.day),
    ].reduce<string | null>(
      (last, next) => (last === null || next > last ? next : last),
      null
    );

  /** Slots this term so far plus every one planned from today. */
  const countFor = (userId: string, role: PoolRole, served: number) =>
    served +
    placements.filter(
      (p) => p.key === userId && p.role === role && p.day >= today
    ).length;

  const cooks = (day: string, cookingGroup: string | null, userId: string) => {
    const person = people.get(userId);
    const spellings = new Set(
      [person?.name, person?.writeAs, ...(person?.names ?? [])]
        .filter((name): name is string => Boolean(name))
        .map(nameKey)
    );
    const group = termOn(data.terms, day)?.groups.find((g) =>
      sameName(g.name, cookingGroup)
    );
    return Boolean(
      group?.members.some((member) =>
        member.userId
          ? member.userId === userId
          : spellings.has(nameKey(member.name))
      )
    );
  };

  /** Already serving that day, or in this role too recently (before or after). */
  const busy = (userId: string, role: PoolRole, day: string) =>
    placements.some(
      (p) =>
        p.key === userId &&
        (p.day === day ||
          (p.role === role && daysBetween(p.day, day) < MIN_GAP_DAYS))
    );

  const away = (userId: string, day: string) =>
    data.away.some(
      (row) => row.userId === userId && row.startsOn <= day && day <= row.endsOn
    );

  /** Everyone who may take an open slot in `role`, with what ranks them. */
  return (
    schedule: PlanSchedule,
    role: PoolRole,
    cookingGroup: string | null
  ): Candidate[] => {
    const day = localDay(schedule.date);
    return data.pool.flatMap((entry) => {
      const person = people.get(entry.userId);
      const eligible =
        entry.role === role &&
        (entry.scope === "both" || entry.scope === schedule.type) &&
        !(entry.pausedUntil !== null && entry.pausedUntil >= day);
      if (
        !(person && eligible) ||
        away(entry.userId, day) ||
        busy(entry.userId, role, day) ||
        (NOT_WHILE_COOKING.includes(role) &&
          cooks(day, cookingGroup, entry.userId))
      ) {
        return [];
      }
      return [
        {
          backup: entry.status === "backup",
          count: countFor(entry.userId, role, entry.servedThisTerm),
          last: lastBefore(entry.userId, role, day),
          name: person.writeAs,
          userId: entry.userId,
        },
      ];
    });
  };
}

/** Who already serves where, from the slots as the generator starts. */
function placementsOf(
  data: PlanData,
  rows: PlanRow[],
  values: Map<PlanRow, Values>
): Placement[] {
  const userFor = accountResolver(data);
  return rows.flatMap((row) => {
    const { schedule } = row;
    const current = values.get(row);
    return PLAN_COLUMNS.flatMap((column) => {
      const role = columnRole(column, schedule.type);
      const name = current?.[column];
      if (!(role && role !== "preacher" && name)) {
        return [];
      }
      const userId = userFor(schedule.id, role, name);
      return [
        {
          day: localDay(schedule.date),
          key: userId ?? `name:${nameKey(name)}`,
          role,
        },
      ];
    });
  });
}

/**
 * Fills a draft's open person slots in place, the slot with the fewest
 * people free first, so nobody a scarce role needs is used up on a slot
 * others could fill.
 */
function fillPeople(
  schedule: PlanSchedule,
  current: Values,
  freeFor: ReturnType<typeof peopleRules>,
  placements: Placement[]
) {
  const picks: GeneratedPick[] = [];
  const open: PlanColumn[] = [];
  const todo = openPersonSlots(schedule, current);
  while (todo.length > 0) {
    const [next] = todo
      .map((column) => {
        const role = columnRole(column, schedule.type) as PoolRole;
        return {
          column,
          free: freeFor(schedule, role, current.cookingGroup),
          role,
        };
      })
      .sort(
        (a, b) =>
          a.free.length - b.free.length ||
          PLAN_COLUMNS.indexOf(a.column) - PLAN_COLUMNS.indexOf(b.column)
      );
    if (!next) {
      break;
    }
    todo.splice(todo.indexOf(next.column), 1);
    const pick = pickFrom(next.free);
    if (pick) {
      current[next.column] = pick.name;
      placements.push({
        day: localDay(schedule.date),
        key: pick.userId ?? pick.name,
        role: next.role,
      });
      picks.push({ column: next.column, ...pick });
    } else {
      open.push(next.column);
    }
  }
  return { open, picks };
}

/**
 * Fills a gathering's open group slots in place and moves the rotations on.
 * Cooking first: who cooks decides who may lead or play that day.
 */
function fillGroups(
  schedule: PlanSchedule,
  current: Values,
  groups: string[],
  last: Record<GroupColumn, string | null>,
  writes: boolean
) {
  const picks: GeneratedPick[] = [];
  const open: PlanColumn[] = [];
  const jobs: [GroupColumn, GroupColumn][] = [
    ["cookingGroup", "cleaningGroup"],
    ["cleaningGroup", "cookingGroup"],
  ];
  for (const [column, other] of jobs) {
    if (!hasColumn(column, schedule.type)) {
      continue;
    }
    const pick =
      writes && !current[column]
        ? rotate(column, groups, last[column], current[other])
        : null;
    if (pick) {
      current[column] = pick.name;
      picks.push(pick);
    } else if (writes && !current[column]) {
      open.push(column);
    }
    last[column] = current[column] ?? last[column];
  }
  return { open, picks };
}

/**
 * Fills the open slots of the draft rows in `rows` (date order not needed),
 * deterministically, and says why for each pick. Pure: the same data gives
 * the same plan, so mita can trust and test it.
 *
 * - People come from the serving pool for that role (a Leader leads the
 *   service as liturgist, PA Besar as leader, as their Leads switch says),
 *   with the gathering in their scope, not paused that day, not marked
 *   unavailable, not already serving that day, and never in the same role
 *   within `MIN_GAP_DAYS`. A liturgist or musician isn't picked while their
 *   group cooks. Backups only when no active person is free.
 * - Among those: fewest slots in that role this term (served plus planned),
 *   then least recently served, then by name. Within a day the slot with the
 *   fewest people free is filled first.
 * - Groups rotate in the term's order: cleaning every gathering, cooking at
 *   services, and the cooking group never cleans the same day. Cancelled
 *   gatherings don't move the rotation on.
 * - Preachers, locked picks and anything filled by hand stay as they are.
 */
export function generatePlan(input: {
  data: PlanData;
  mode: GenerateMode;
  rows: PlanRow[];
  /** Today in Aachen, `yyyy-MM-dd`: earlier days are left alone. */
  today: string;
}): GeneratedRow[] {
  const { data, today } = input;
  const clears = input.mode === "regenerate";
  const rows = input.rows
    .filter((row) => !row.schedule.cancelled)
    .sort(
      (a, b) =>
        a.schedule.date.getTime() - b.schedule.date.getTime() ||
        a.schedule.id - b.schedule.id
    );
  const values = new Map(
    rows.map((row) => [
      row,
      startingValues(row, clears && generates(row, today)),
    ])
  );
  const placements = placementsOf(data, rows, values);
  const freeFor = peopleRules(data, placements, today);
  const last: Record<GroupColumn, string | null> = {
    cleaningGroup: data.lastGroups?.cleaning ?? null,
    cookingGroup: data.lastGroups?.cooking ?? null,
  };

  return rows.flatMap((row): GeneratedRow[] => {
    const { schedule } = row;
    const current = values.get(row) ?? startingValues(row, false);
    const writes = generates(row, today);
    const groups = inOrder(
      termOn(data.terms, localDay(schedule.date))?.groups.map((g) => g.name) ??
        []
    );
    const forGroups = fillGroups(schedule, current, groups, last, writes);
    if (!writes) {
      return [];
    }
    const forPeople = fillPeople(schedule, current, freeFor, placements);
    return [
      {
        cleared: PLAN_COLUMNS.filter(
          (column) =>
            startingValue(row, column, clears) === null &&
            slotHolder(schedule[column]) !== null
        ),
        open: [...forGroups.open, ...forPeople.open],
        picks: [...forGroups.picks, ...forPeople.picks],
        row,
      },
    ];
  });
}
