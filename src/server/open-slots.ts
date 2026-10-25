import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, lt, ne } from "drizzle-orm";
import { DateTime } from "luxon";
import {
  groupMembers,
  groups,
  groupTerms,
  type Schedule,
  scheduleAssignments,
  schedules,
  servingPool,
  users,
} from "~/lib/db/schema/schema";
import {
  isCancelled,
  localDay,
  sameDayWarning,
  slotColumn,
  slotHolder,
  type TakeCheck,
  takeRefusal,
  termOn,
} from "~/lib/schedule-team";
import type { PoolRole, PoolScope, PoolStatus } from "~/lib/serving-pool";
import { SERVING_ROLES, type ServingRole } from "~/lib/serving-roles";
import { db } from "~/server";
import { groupKey } from "~/server/duties";
import {
  syncAssignments,
  type Transaction,
} from "~/server/schedule-assignments";

/** Gatherings happen in Aachen, so "today" is read in its zone. */
const ZONE = "Europe/Berlin";
/** How far ahead members see open slots. */
export const OPEN_SLOT_WEEKS = 8;

type Reader = Pick<Transaction, "select">;

/** What the hard rules need to know about the member, read once. */
async function memberFacts(tx: Reader, userId: string) {
  const [entries, own, terms, serving] = await Promise.all([
    tx
      .select({
        pausedUntil: servingPool.pausedUntil,
        role: servingPool.role,
        scope: servingPool.scope,
        status: servingPool.status,
      })
      .from(servingPool)
      .where(eq(servingPool.userId, userId)),
    tx
      .select({ name: groups.name, termId: groups.termId })
      .from(groupMembers)
      .innerJoin(groups, eq(groups.id, groupMembers.groupId))
      .where(eq(groupMembers.userId, userId)),
    tx.select().from(groupTerms),
    tx
      .select({
        date: schedules.date,
        role: scheduleAssignments.role,
        scheduleId: scheduleAssignments.scheduleId,
      })
      .from(scheduleAssignments)
      .innerJoin(schedules, eq(schedules.id, scheduleAssignments.scheduleId))
      .where(eq(scheduleAssignments.userId, userId)),
  ]);
  const entryFor = (role: PoolRole) => {
    const entry = entries.find((row) => row.role === role);
    return (
      entry && {
        pausedUntil: entry.pausedUntil,
        scope: entry.scope as PoolScope,
        status: entry.status as PoolStatus,
      }
    );
  };
  /** The member's group cooks at this gathering, in the term in force that day. */
  const cooks = (schedule: Schedule) => {
    const cooking = groupKey(schedule.cookingGroup);
    const term = termOn(terms, localDay(schedule.date));
    return (
      cooking !== "" &&
      own.some(
        (group) => group.termId === term?.id && groupKey(group.name) === cooking
      )
    );
  };
  /** The slots the member already has that day, apart from this one. */
  const servingOn = (schedule: Schedule, role: ServingRole) =>
    serving
      .filter(
        (slot) =>
          localDay(slot.date) === localDay(schedule.date) &&
          !(slot.scheduleId === schedule.id && slot.role === role)
      )
      .map((slot) => slot.role as ServingRole)
      .sort((a, b) => SERVING_ROLES.indexOf(a) - SERVING_ROLES.indexOf(b));
  return { cooks, entries, entryFor, servingOn };
}

type Facts = Awaited<ReturnType<typeof memberFacts>>;

/** The hard-rule check for one slot of one gathering. */
function checkFor(
  facts: Facts,
  schedule: Schedule,
  role: PoolRole,
  holderIsMember: boolean,
  now: Date
): TakeCheck {
  const column = slotColumn(role, schedule.type);
  const holder = column ? slotHolder(schedule[column]) : null;
  return {
    cancelled: isCancelled(schedule),
    cooksThatDay: facts.cooks(schedule),
    day: localDay(schedule.date),
    entry: facts.entryFor(role),
    holder,
    mine: holder !== null && holderIsMember,
    role,
    today: localDay(now),
    type: schedule.type,
  };
}

export interface OpenSlot {
  date: Date;
  /** Why the member can't take it, or null when they can. */
  refusal: string | null;
  role: PoolRole;
  scheduleId: number;
  title: string;
  type: Schedule["type"];
  /** A note that doesn't stop them, e.g. they already serve that day. */
  warning: string | null;
}

/**
 * The open slots in the coming weeks for the roles the member is active in,
 * with the gathering in their scope, and whether they're active in any role. Slots a hard rule rules out (a pause,
 * their group cooking) stay listed with the reason, so they know why.
 */
export async function loadOpenSlots(
  userId: string,
  now = new Date()
): Promise<{ active: boolean; slots: OpenSlot[] }> {
  const facts = await memberFacts(db, userId);
  const active = facts.entries.filter((entry) => entry.status === "active");
  if (active.length === 0) {
    return { active: false, slots: [] };
  }
  const today = DateTime.fromJSDate(now).setZone(ZONE).startOf("day");
  const upcoming = await db
    .select()
    .from(schedules)
    .where(
      and(
        // Nobody serves at a cancelled gathering, so none of its slots are open.
        eq(schedules.cancelled, false),
        gte(schedules.date, today.toJSDate()),
        lt(schedules.date, today.plus({ weeks: OPEN_SLOT_WEEKS }).toJSDate())
      )
    )
    .orderBy(asc(schedules.date), asc(schedules.id));
  const slots = upcoming.flatMap((schedule) =>
    active.flatMap((entry) => {
      const role = entry.role as PoolRole;
      const column = slotColumn(role, schedule.type);
      const inScope = entry.scope === "both" || entry.scope === schedule.type;
      if (!(column && inScope) || slotHolder(schedule[column])) {
        return [];
      }
      return [
        {
          date: schedule.date,
          refusal: takeRefusal(checkFor(facts, schedule, role, false, now)),
          role,
          scheduleId: schedule.id,
          title: schedule.title,
          type: schedule.type,
          warning: sameDayWarning(facts.servingOn(schedule, role)),
        },
      ];
    })
  );
  return { active: true, slots };
}

/** How the schedule already writes the member, or their account name. */
async function scheduleName(tx: Transaction, userId: string) {
  const [written] = await tx
    .select({ name: scheduleAssignments.name })
    .from(scheduleAssignments)
    .where(
      and(
        eq(scheduleAssignments.userId, userId),
        ne(scheduleAssignments.role, "preacher")
      )
    )
    .orderBy(desc(scheduleAssignments.id))
    .limit(1);
  if (written) {
    return written.name;
  }
  const [user] = await tx
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId));
  return user?.name?.trim() || null;
}

/**
 * Puts the member in an open slot when every hard rule allows it. The
 * gathering's row is locked, so two members can't take the same slot.
 */
export function takeSlot(
  userId: string,
  scheduleId: number,
  role: PoolRole,
  now = new Date()
) {
  return db.transaction(async (tx) => {
    const [schedule] = await tx
      .select()
      .from(schedules)
      .where(eq(schedules.id, scheduleId))
      .for("update");
    if (!schedule) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Schedule not found.",
      });
    }
    const [facts, assignments] = await Promise.all([
      memberFacts(tx, userId),
      tx
        .select()
        .from(scheduleAssignments)
        .where(eq(scheduleAssignments.scheduleId, scheduleId)),
    ]);
    const holderIsMember = assignments.some(
      (row) => row.role === role && row.userId === userId
    );
    const check = checkFor(facts, schedule, role, holderIsMember, now);
    const refusal = takeRefusal(check);
    if (refusal) {
      throw new TRPCError({
        code: check.holder && !check.mine ? "CONFLICT" : "BAD_REQUEST",
        message: refusal,
      });
    }
    const column = slotColumn(role, schedule.type);
    const name = await scheduleName(tx, userId);
    if (!(column && name)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Your account has no name yet, so the schedule can't show you.",
      });
    }
    await tx
      .update(schedules)
      .set({ [column]: name })
      .where(eq(schedules.id, scheduleId));
    if (assignments.length === 0) {
      // Written by the previous release: derive the rest of the team first.
      await syncAssignments(tx, scheduleId, schedule);
    }
    await tx
      .delete(scheduleAssignments)
      .where(
        and(
          eq(scheduleAssignments.scheduleId, scheduleId),
          eq(scheduleAssignments.role, role)
        )
      );
    await tx
      .insert(scheduleAssignments)
      .values({ name, role, scheduleId, userId });
    return { name, warning: sameDayWarning(facts.servingOn(schedule, role)) };
  });
}
