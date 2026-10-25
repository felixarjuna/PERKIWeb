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
  columnRole,
  hasColumn,
  type PlanColumn,
  type PlanData,
  planColumnLabels,
} from "~/lib/plan-grid";
import { localDay } from "~/lib/schedule-team";
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

/** Midnight in Aachen at the start of a `yyyy-MM-dd` day. */
const aachenStart = (day: string) =>
  DateTime.fromISO(day, { zone: "Europe/Berlin" }).toJSDate();

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

/**
 * Everything the planning grid needs for one Aachen month (`yyyy-MM`): its
 * gatherings, the serving pool with this term's counts, who can't serve,
 * the group terms and the speakers. Staff only: it carries pause and
 * unavailability notes.
 */
export async function loadPlan(month: string, now = new Date()) {
  const { before, from } = monthRange(month);
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
  const [assignments, latest, counts] = await Promise.all([
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
      id: row.id,
      leader: row.leader,
      multimedia: row.multimedia,
      musician: row.musician,
      noteWriter: row.noteWriter,
      preacher: row.preacher,
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
  return { ...data, month, today };
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
 * Writes one slot from the grid: the schedule column, then that role's
 * assignment, as the schedule form does (the name resolved through name
 * links, or linked to the account picked from the pool). The rest of the
 * team keeps its assignments. The row is locked, so two mita editing the
 * same gathering don't lose each other's change.
 */
export function setPlanSlot(input: {
  column: PlanColumn;
  name: string | null;
  scheduleId: number;
  userId?: string;
}) {
  return db.transaction(async (tx) => {
    const [schedule] = await tx
      .select()
      .from(schedules)
      .where(eq(schedules.id, input.scheduleId))
      .for("update");
    if (!schedule) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Schedule not found.",
      });
    }
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
      .set({ [input.column]: stored })
      .where(eq(schedules.id, schedule.id));
    const role = columnRole(input.column, schedule.type);
    if (role === null) {
      return { name };
    }
    await writeAssignment(tx, schedule, input.column, role, name);
    if (name && input.userId && role !== "preacher") {
      await linkPicked(tx, schedule.id, role, input.userId);
    }
    return { name };
  });
}
