import { eq, inArray, sql } from "drizzle-orm";
import {
  type NewSchedule,
  scheduleAssignments,
  schedules,
  users,
} from "~/lib/db/schema/schema";
import { slotsFromSchedule } from "~/lib/schedule-team";
import type { db } from "~/server";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Replaces a schedule's assignments with the names in its slot columns. A
 * name is linked to an account only when exactly one user has that name.
 */
export async function syncAssignments(
  tx: Transaction,
  scheduleId: number,
  schedule: Parameters<typeof slotsFromSchedule>[0]
) {
  await tx
    .delete(scheduleAssignments)
    .where(eq(scheduleAssignments.scheduleId, scheduleId));
  const slots = slotsFromSchedule(schedule);
  if (slots.length === 0) {
    return;
  }
  const names = [...new Set(slots.map((slot) => slot.name.toLowerCase()))];
  const matches = await tx
    .select({ id: users.id, name: sql<string>`lower(${users.name})` })
    .from(users)
    .where(inArray(sql`lower(${users.name})`, names));
  const userIdFor = (name: string) => {
    const found = matches.filter((user) => user.name === name.toLowerCase());
    return found.length === 1 ? found[0]?.id : undefined;
  };
  await tx.insert(scheduleAssignments).values(
    slots.map((slot) => ({
      name: slot.name,
      role: slot.role,
      scheduleId,
      userId: userIdFor(slot.name),
    }))
  );
}

export const insertSchedule = (tx: Transaction, schedule: NewSchedule) =>
  tx
    .insert(schedules)
    .values(schedule)
    .returning({ id: schedules.id })
    .then(async ([row]) => {
      if (row) {
        await syncAssignments(tx, row.id, schedule);
      }
      return row;
    });
