import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  lt,
  lte,
  ne,
  sql,
} from "drizzle-orm";
import { DateTime } from "luxon";
import {
  groupMembers,
  groups,
  groupTerms,
  nameLinks,
  profiles,
  scheduleAssignments,
  schedules,
  servingPool,
  speakers,
  unavailability,
  users,
} from "~/lib/db/schema/schema";
import { monthRange } from "~/lib/months";
import {
  type GeneratedRow,
  type GenerateMode,
  generatePlan,
} from "~/lib/plan-generator";
import {
  columnRole,
  type GeneratedSlot,
  hasColumn,
  MAX_PLAN_MONTHS,
  PLAN_TITLES,
  type PlanColumn,
  type PlanData,
  type PlanSchedule,
  planColumnLabels,
  planRows,
  regularGatherings,
} from "~/lib/plan-grid";
import { localDay, slotHolder, startOn } from "~/lib/schedule-team";
import {
  type PoolRole,
  type PoolScope,
  type PoolStatus,
  termWindow,
} from "~/lib/serving-pool";
import type { ServingRole } from "~/lib/serving-roles";
import { db } from "~/server";
import { resolveAccounts } from "~/server/people";
import {
  syncAssignments,
  type Transaction,
} from "~/server/schedule-assignments";
import { servedCounts } from "~/server/served-counts";
import { resolveSpeakers } from "~/server/speakers";

const ZONE = "Europe/Berlin";

/** Midnight in Aachen at the start of a `yyyy-MM-dd` day. */
const aachenStart = (day: string) =>
  DateTime.fromISO(day, { zone: ZONE }).toJSDate();

/** Everyone who serves, with every spelling the schedule may write them by. */
async function loadPeople(userIds: string[]): Promise<PlanData["people"]> {
  if (userIds.length === 0) {
    return [];
  }
  const [accounts, links, written] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, nickname: profiles.nickname })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(inArray(users.id, userIds)),
    db
      .select({ name: nameLinks.name, userId: nameLinks.userId })
      .from(nameLinks)
      .where(inArray(nameLinks.userId, userIds)),
    // Newest first, so the first per account is how the schedule writes them now.
    db
      .select({
        name: scheduleAssignments.name,
        userId: scheduleAssignments.userId,
      })
      .from(scheduleAssignments)
      .where(
        and(
          inArray(scheduleAssignments.userId, userIds),
          ne(scheduleAssignments.role, "preacher")
        )
      )
      .orderBy(desc(scheduleAssignments.id)),
  ]);
  return accounts.map((account) => {
    const own = written.filter((slot) => slot.userId === account.id);
    const name = account.name?.trim() || account.nickname?.trim() || "Member";
    return {
      name,
      names: [
        ...new Set(
          [
            account.nickname,
            ...links
              .filter((link) => link.userId === account.id)
              .map((link) => link.name),
            ...own.map((slot) => slot.name),
          ].filter((value): value is string => Boolean(value?.trim()))
        ),
      ],
      userId: account.id,
      writeAs: own[0]?.name ?? name,
    };
  });
}

/** The latest group named for one job before `before`, at a gathering that happened. */
async function lastGroupIn(
  column: typeof schedules.cookingGroup | typeof schedules.cleaningGroup,
  before: Date
) {
  const [row] = await db
    .select({ name: column })
    .from(schedules)
    .where(
      and(
        eq(schedules.cancelled, false),
        lt(schedules.date, before),
        sql`coalesce(trim(${column}), '') not in ('', '-')`
      )
    )
    .orderBy(desc(schedules.date), desc(schedules.id))
    .limit(1);
  return row?.name?.trim() ?? null;
}

/** Where the cooking and cleaning rotations stood before the range. */
async function lastGroupsBefore(before: Date) {
  const [cooking, cleaning] = await Promise.all([
    lastGroupIn(schedules.cookingGroup, before),
    lastGroupIn(schedules.cleaningGroup, before),
  ]);
  return { cleaning, cooking };
}

/**
 * Everything the planning grid needs for one Aachen month (`yyyy-MM`): its
 * gatherings, the serving pool with this term's counts, who can't serve,
 * the group terms and the speakers. Staff only: it carries pause and
 * unavailability notes.
 */
export async function loadPlan(month: string, months = 1, now = new Date()) {
  const { from } = monthRange(month);
  const before = DateTime.fromJSDate(from)
    .setZone(ZONE)
    .plus({ months })
    .toJSDate();
  const first = localDay(from);
  const last = localDay(new Date(before.getTime() - 1));
  const today = localDay(now);
  const [rows, terms, groupRows, memberRows, poolRows, away, speakerRows] =
    await Promise.all([
      db
        .select()
        .from(schedules)
        .where(and(gte(schedules.date, from), lt(schedules.date, before)))
        .orderBy(asc(schedules.date), asc(schedules.id)),
      db.select().from(groupTerms).orderBy(asc(groupTerms.startsOn)),
      db.select().from(groups).orderBy(asc(groups.name)),
      db
        .select({
          groupId: groupMembers.groupId,
          name: groupMembers.name,
          userId: groupMembers.userId,
        })
        .from(groupMembers),
      db
        .select({
          pausedUntil: servingPool.pausedUntil,
          role: servingPool.role,
          scope: servingPool.scope,
          status: servingPool.status,
          userId: servingPool.userId,
        })
        .from(servingPool),
      db
        .select({
          endsOn: unavailability.endsOn,
          note: unavailability.note,
          startsOn: unavailability.startsOn,
          userId: unavailability.userId,
        })
        .from(unavailability)
        .where(
          and(
            lte(unavailability.startsOn, last),
            gte(unavailability.endsOn, first)
          )
        ),
      db
        .select({ name: speakers.name })
        .from(speakers)
        .where(eq(speakers.active, true))
        .orderBy(asc(speakers.id)),
    ]);
  const ids = rows.map((row) => row.id);
  const term = termWindow(terms, today);
  const [assignments, latest, counts, lastGroups] = await Promise.all([
    ids.length > 0
      ? db
          .select({
            role: scheduleAssignments.role,
            scheduleId: scheduleAssignments.scheduleId,
            userId: scheduleAssignments.userId,
          })
          .from(scheduleAssignments)
          .where(inArray(scheduleAssignments.scheduleId, ids))
      : [],
    // The last slot before the month per account and role, served or planned.
    db
      .select({
        last: sql<Date | string>`max(${schedules.date})`,
        role: scheduleAssignments.role,
        userId: scheduleAssignments.userId,
      })
      .from(scheduleAssignments)
      .innerJoin(schedules, eq(schedules.id, scheduleAssignments.scheduleId))
      .where(
        and(
          isNotNull(scheduleAssignments.userId),
          eq(schedules.cancelled, false),
          lt(schedules.date, from)
        )
      )
      .groupBy(scheduleAssignments.userId, scheduleAssignments.role),
    servedCounts(
      term.from ? aachenStart(term.from) : null,
      term.before ? aachenStart(term.before) : now
    ),
    lastGroupsBefore(from),
  ]);
  const served = new Map(
    counts.map((count) => [`${count.userId} ${count.role}`, count.served])
  );
  const userIds = [
    ...new Set([
      ...poolRows.map((row) => row.userId),
      ...assignments.flatMap((row) => (row.userId ? [row.userId] : [])),
    ]),
  ];
  const data: PlanData = {
    assignments,
    away,
    before: latest.flatMap((row) =>
      row.userId
        ? [
            {
              day: localDay(new Date(row.last)),
              role: row.role,
              userId: row.userId,
            },
          ]
        : []
    ),
    lastGroups,
    people: await loadPeople(userIds),
    pool: poolRows.map((row) => ({
      pausedUntil: row.pausedUntil,
      role: row.role as PoolRole,
      scope: row.scope as PoolScope,
      servedThisTerm: served.get(`${row.userId} ${row.role}`) ?? 0,
      status: row.status as PoolStatus,
      userId: row.userId,
    })),
    schedules: rows.map((row) => ({
      accommodation: row.accommodation,
      cancelled: row.cancelled,
      cleaningGroup: row.cleaningGroup,
      cookingGroup: row.cookingGroup,
      date: row.date,
      flags: row.flags,
      generated: row.generated,
      id: row.id,
      leader: row.leader,
      multimedia: row.multimedia,
      musician: row.musician,
      noteWriter: row.noteWriter,
      preacher: row.preacher,
      published: row.published,
      title: row.title,
      type: row.type,
    })),
    speakers: speakerRows.map((row) => row.name),
    terms: terms.map((row) => ({
      groups: groupRows
        .filter((group) => group.termId === row.id)
        .map((group) => ({
          members: memberRows
            .filter((member) => member.groupId === group.id)
            .map(({ name, userId }) => ({ name, userId })),
          name: group.name,
        })),
      startsOn: row.startsOn,
    })),
  };
  return { ...data, month, months, today };
}

/** Columns the schedule requires; an emptied one is stored as "". */
const REQUIRED: readonly PlanColumn[] = [
  "leader",
  "musician",
  "noteWriter",
  "cleaningGroup",
];

type Locked = typeof schedules.$inferSelect;

/**
 * Replaces one role's assignment with the new name: a preacher resolved to a
 * speaker, anyone else through name links. A schedule an older release wrote
 * gets its whole team derived first.
 */
async function writeAssignment(
  tx: Transaction,
  schedule: Locked,
  column: PlanColumn,
  role: ServingRole,
  name: string | null
) {
  const existing = await tx
    .select({ id: scheduleAssignments.id })
    .from(scheduleAssignments)
    .where(eq(scheduleAssignments.scheduleId, schedule.id))
    .limit(1);
  if (existing.length === 0) {
    await syncAssignments(tx, schedule.id, { ...schedule, [column]: name });
    return;
  }
  await tx
    .delete(scheduleAssignments)
    .where(
      and(
        eq(scheduleAssignments.scheduleId, schedule.id),
        eq(scheduleAssignments.role, role)
      )
    );
  if (!name) {
    return;
  }
  if (role === "preacher") {
    const speakerFor = await resolveSpeakers(tx);
    await tx.insert(scheduleAssignments).values({
      name,
      role,
      scheduleId: schedule.id,
      speakerId: speakerFor(name),
    });
    return;
  }
  const accountFor = await resolveAccounts(tx, [name]);
  await tx.insert(scheduleAssignments).values({
    name,
    role,
    scheduleId: schedule.id,
    userId: accountFor(name),
  });
}

/** Picked from the pool: links the account even when the spelling is shared. */
async function linkPicked(
  tx: Transaction,
  scheduleId: number,
  role: ServingRole,
  userId: string
) {
  const [user] = await tx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId));
  if (user) {
    await tx
      .update(scheduleAssignments)
      .set({ userId: user.id })
      .where(
        and(
          eq(scheduleAssignments.scheduleId, scheduleId),
          eq(scheduleAssignments.role, role)
        )
      );
  }
}

/**
 * The gathering a grid cell writes to, locked: a stored one by id, or the one
 * on a regular day, added as a draft with the sheet's title at 15:30 when
 * that day has none of that kind yet. A lock on the day keeps two cells of the same new
 * row from adding it twice.
 */
async function targetSchedule(
  tx: Transaction,
  input: {
    newGathering?: { day: string; type: PlanSchedule["type"] };
    scheduleId?: number;
  }
): Promise<Locked> {
  if (input.scheduleId) {
    const [stored] = await tx
      .select()
      .from(schedules)
      .where(eq(schedules.id, input.scheduleId))
      .for("update");
    if (!stored) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Schedule not found.",
      });
    }
    return stored;
  }
  const wanted = input.newGathering;
  const day = wanted && DateTime.fromISO(wanted.day, { zone: ZONE });
  if (!(wanted && day?.isValid)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Pick a gathering to fill.",
    });
  }
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${wanted.day}))`);
  const [existing] = await tx
    .select()
    .from(schedules)
    .where(
      and(
        eq(schedules.type, wanted.type),
        gte(schedules.date, day.startOf("day").toJSDate()),
        lt(schedules.date, day.plus({ days: 1 }).startOf("day").toJSDate())
      )
    )
    .orderBy(asc(schedules.id))
    .limit(1)
    .for("update");
  if (existing) {
    return existing;
  }
  const [added] = await tx
    .insert(schedules)
    .values({
      bibleVerse: "",
      cleaningGroup: "",
      date: startOn({ day: day.day, month: day.month, year: day.year }),
      description: "",
      leader: "",
      musician: "",
      noteWriter: "",
      // Planned ahead, so only staff see it until they publish the range.
      published: false,
      title: PLAN_TITLES[wanted.type],
      type: wanted.type,
    })
    .returning();
  if (!added) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The gathering couldn't be added.",
    });
  }
  return added;
}

/**
 * Writes one slot from the grid: the schedule column, then that role's
 * assignment, as the schedule form does (the name resolved through name
 * links, or linked to the account picked from the pool). The rest of the
 * team keeps its assignments. The row is locked, so two mita editing the
 * same gathering don't lose each other's change.
 */
export function setPlanSlot(input: {
  column: PlanColumn;
  name: string | null;
  /** A regular day not added yet: the gathering is added first. */
  newGathering?: { day: string; type: PlanSchedule["type"] };
  scheduleId?: number;
  userId?: string;
}) {
  return db.transaction(async (tx) => {
    const schedule = await targetSchedule(tx, input);
    if (!hasColumn(input.column, schedule.type)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `A Bible study has no ${planColumnLabels[input.column].toLowerCase()} slot.`,
      });
    }
    const name = input.name?.trim() || null;
    let stored: string | null = name;
    if (stored === null && REQUIRED.includes(input.column)) {
      stored = "";
    }
    await tx
      .update(schedules)
      .set({
        [input.column]: stored,
        // Picked by hand: no longer the generator's, so "Regenerate" keeps it.
        generated: sql`${schedules.generated} - ${input.column}::text`,
      })
      .where(eq(schedules.id, schedule.id));
    const role = columnRole(input.column, schedule.type);
    if (role === null) {
      return { name, scheduleId: schedule.id };
    }
    await writeAssignment(tx, schedule, input.column, role, name);
    if (name && input.userId && role !== "preacher") {
      await linkPicked(tx, schedule.id, role, input.userId);
    }
    return { name, scheduleId: schedule.id };
  });
}

/** Keeps a generated pick: "Regenerate" leaves a locked slot alone. */
export async function lockPlanSlot(input: {
  column: PlanColumn;
  scheduleId: number;
}) {
  const [row] = await db
    .update(schedules)
    .set({
      generated: sql`jsonb_set(${schedules.generated}, array[${input.column}::text, 'locked'], 'true'::jsonb)`,
    })
    .where(
      and(
        eq(schedules.id, input.scheduleId),
        sql`${schedules.generated} ? ${input.column}::text`
      )
    )
    .returning({ id: schedules.id });
  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "That slot wasn't filled by the generator.",
    });
  }
  return row;
}

/** The first and last Aachen day of a range of whole months. */
export function monthsSpan(from: string, through: string) {
  const start = DateTime.fromFormat(from, "yyyy-MM", { zone: ZONE });
  const end = DateTime.fromFormat(through, "yyyy-MM", { zone: ZONE });
  if (!(start.isValid && end.isValid) || end < start) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Pick a range that ends after it starts.",
    });
  }
  const months = Math.round(end.diff(start, "months").months) + 1;
  if (months > MAX_PLAN_MONTHS) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Pick at most ${MAX_PLAN_MONTHS} months at once.`,
    });
  }
  return {
    before: end.plus({ months: 1 }).toJSDate(),
    from: start.toJSDate(),
    months,
  };
}

/** One generated row as stored: the slot values and the generator's notes. */
async function writeGeneratedRow(
  tx: Transaction,
  generated: GeneratedRow
): Promise<number> {
  const { row } = generated;
  const day = localDay(row.schedule.date);
  const schedule = await targetSchedule(
    tx,
    row.suggested
      ? { newGathering: { day, type: row.schedule.type } }
      : { scheduleId: row.schedule.id }
  );
  // Published or cancelled since the grid was read: leave it to mita.
  if (schedule.published || schedule.cancelled) {
    return 0;
  }
  // Only what is still the generator's unlocked pick is emptied.
  const clears = generated.cleared.filter(
    (column) =>
      schedule.generated[column] && schedule.generated[column].locked !== true
  );
  const notes: Record<string, GeneratedSlot> = Object.fromEntries(
    Object.entries(schedule.generated).filter(
      ([column]) => !clears.includes(column as PlanColumn)
    )
  );
  const changes: Partial<Record<PlanColumn, string | null>> = {};
  for (const column of clears) {
    changes[column] = REQUIRED.includes(column) ? "" : null;
  }
  const holds = (column: PlanColumn) =>
    column in changes ? changes[column] : schedule[column];
  for (const pick of generated.picks) {
    // Someone filled it in the meantime.
    if (slotHolder(holds(pick.column))) {
      continue;
    }
    changes[pick.column] = pick.name;
    notes[pick.column] = { reason: pick.reason };
  }
  const columns = Object.keys(changes) as PlanColumn[];
  if (columns.length === 0) {
    return 0;
  }
  await tx
    .update(schedules)
    .set({ ...(changes as Partial<Locked>), generated: notes })
    .where(eq(schedules.id, schedule.id));
  for (const column of columns) {
    const role = columnRole(column, schedule.type);
    if (role === null || role === "preacher") {
      continue;
    }
    const name = slotHolder(changes[column]);
    // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
    await writeAssignment(
      tx,
      { ...schedule, ...changes } as Locked,
      column,
      role,
      name
    );
    const userId = generated.picks.find((p) => p.column === column)?.userId;
    if (name && userId) {
      await linkPicked(tx, schedule.id, role, userId);
    }
  }
  return generated.picks.filter((pick) => changes[pick.column] === pick.name)
    .length;
}

/**
 * Generates drafts for the months `from` through `through` (`yyyy-MM`):
 * fills every open slot of draft gatherings and regular days not added yet
 * (adding them as drafts), or with "regenerate" also refills the unlocked
 * picks it made before. One run at a time; each row is locked while it's
 * written and anything filled in the meantime is kept.
 */
export async function generateRange(input: {
  from: string;
  mode: GenerateMode;
  through: string;
}) {
  const { months } = monthsSpan(input.from, input.through);
  const data = await loadPlan(input.from, months);
  const rows = planRows(data.schedules, regularGatherings(input.from, months));
  const result = generatePlan({
    data,
    mode: input.mode,
    rows,
    today: data.today,
  });
  const filled = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('schedule-generator'))`
    );
    let count = 0;
    for (const generated of result) {
      if (generated.picks.length > 0 || generated.cleared.length > 0) {
        // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
        count += await writeGeneratedRow(tx, generated);
      }
    }
    return count;
  });
  return {
    filled,
    open: result.reduce((sum, row) => sum + row.open.length, 0),
  };
}

/**
 * Publishes every draft gathering in the months `from` through `through`:
 * from now on members see them on the schedule, in My duties, open slots
 * and their calendars.
 */
export async function publishRange(input: { from: string; through: string }) {
  const span = monthsSpan(input.from, input.through);
  const rows = await db
    .update(schedules)
    .set({ published: true })
    .where(
      and(
        eq(schedules.published, false),
        gte(schedules.date, span.from),
        lt(schedules.date, span.before)
      )
    )
    .returning({ id: schedules.id });
  return { published: rows.length };
}
