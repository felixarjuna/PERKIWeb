import { and, eq, gte, isNotNull, lt, lte, sql } from "drizzle-orm";
import { scheduleAssignments, schedules } from "~/lib/db/schema/schema";
import { db } from "~/server";

/** How often each account served in each role: in the window, and ever. */
export function servedCounts(from: Date | null, before: Date) {
  const inTerm = from
    ? and(gte(schedules.date, from), lt(schedules.date, before))
    : lt(schedules.date, before);
  return db
    .select({
      last: sql<Date | string | null>`max(${schedules.date})`,
      role: scheduleAssignments.role,
      served: sql<number>`count(*) filter (where ${inTerm})`.mapWith(Number),
      userId: scheduleAssignments.userId,
    })
    .from(scheduleAssignments)
    .innerJoin(schedules, eq(schedules.id, scheduleAssignments.scheduleId))
    .where(
      and(
        isNotNull(scheduleAssignments.userId),
        // Nobody served at a cancelled gathering.
        eq(schedules.cancelled, false),
        lte(schedules.date, new Date())
      )
    )
    .groupBy(scheduleAssignments.userId, scheduleAssignments.role);
}
