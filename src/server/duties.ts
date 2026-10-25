import { asc, eq, inArray, or, sql } from "drizzle-orm";
import { DateTime } from "luxon";
import {
  groupMembers,
  groups,
  groupTerms,
  type Schedule,
  scheduleAssignments,
  schedules,
} from "~/lib/db/schema/schema";
import type { Duty } from "~/lib/duties";
import { localDay, termOn } from "~/lib/schedule-team";
import { SERVING_ROLES, type ServingRole } from "~/lib/serving-roles";
import { db } from "~/server";

/** Gatherings happen in Aachen, so "today" is read in its zone. */
const ZONE = "Europe/Berlin";

/** A gathering and what the member does at it. */
export interface DutyDay {
  duties: Duty[];
  schedule: Schedule;
}

export const groupKey = (name: string | null) =>
  name?.trim().toLowerCase() ?? "";

/** The gatherings that name one of these groups for cooking or cleaning. */
const namingGroups = (keys: string[]) =>
  db
    .select()
    .from(schedules)
    .where(
      or(
        inArray(sql`lower(trim(${schedules.cookingGroup}))`, keys),
        inArray(sql`lower(trim(${schedules.cleaningGroup}))`, keys)
      )
    );

/** Cooking and cleaning days of the member's groups, by schedule. */
async function groupDuties(userId: string) {
  const own = await db
    .select({ name: groups.name, termId: groups.termId })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, userId));
  if (own.length === 0) {
    return [];
  }
  const [terms, named] = await Promise.all([
    db.select().from(groupTerms),
    namingGroups([...new Set(own.map((group) => groupKey(group.name)))]),
  ]);
  return named.flatMap((schedule) => {
    // A group name only means this member's group in the term in force that day.
    const term = termOn(terms, localDay(schedule.date));
    const mine = own.find(
      (group) =>
        group.termId === term?.id &&
        [groupKey(schedule.cookingGroup), groupKey(schedule.cleaningGroup)]
          .filter(Boolean)
          .includes(groupKey(group.name))
    );
    if (!mine) {
      return [];
    }
    const duties: Duty[] = [];
    if (groupKey(schedule.cookingGroup) === groupKey(mine.name)) {
      duties.push({ group: mine.name, role: "cooking" });
    }
    if (groupKey(schedule.cleaningGroup) === groupKey(mine.name)) {
      duties.push({ group: mine.name, role: "cleaning" });
    }
    return [{ duties, schedule }];
  });
}

/** The member's serving slots, through their linked assignments. */
async function slotDuties(userId: string) {
  const rows = await db
    .select({ role: scheduleAssignments.role, schedule: schedules })
    .from(scheduleAssignments)
    .innerJoin(schedules, eq(schedules.id, scheduleAssignments.scheduleId))
    .where(eq(scheduleAssignments.userId, userId))
    .orderBy(asc(scheduleAssignments.position));
  return rows.map((row) => ({
    duties: [{ role: row.role as ServingRole }],
    schedule: row.schedule,
  }));
}

const order = (duty: Duty) =>
  duty.role === "cooking" || duty.role === "cleaning"
    ? SERVING_ROLES.length + (duty.role === "cooking" ? 0 : 1)
    : SERVING_ROLES.indexOf(duty.role);

/**
 * Every gathering where the member serves or their group cooks or cleans,
 * except cancelled ones, split at the start of today in Aachen: upcoming soonest first, past most
 * recent first. Only the member's own duties; nobody else's names.
 */
export async function loadDuties(userId: string, now = new Date()) {
  // Nobody serves at a cancelled gathering, so it isn't anyone's duty.
  const found = [
    ...(await slotDuties(userId)),
    ...(await groupDuties(userId)),
  ].filter(({ schedule }) => !schedule.cancelled);
  const byId = new Map<number, DutyDay>();
  for (const { duties, schedule } of found) {
    const day = byId.get(schedule.id) ?? { duties: [], schedule };
    day.duties.push(...duties);
    byId.set(schedule.id, day);
  }
  const days = [...byId.values()];
  for (const day of days) {
    day.duties.sort((a, b) => order(a) - order(b));
  }
  const today = DateTime.fromJSDate(now).setZone(ZONE).startOf("day");
  const time = (day: DutyDay) => day.schedule.date.getTime();
  const upcoming = days
    .filter((day) => time(day) >= today.toMillis())
    .sort((a, b) => time(a) - time(b));
  const past = days
    .filter((day) => time(day) < today.toMillis())
    .sort((a, b) => time(b) - time(a));
  return { past, upcoming };
}
