import { eq } from "drizzle-orm";
import {
  type NewSchedule,
  scheduleAssignments,
  schedules,
} from "~/lib/db/schema/schema";
import { slotsFromSchedule } from "~/lib/schedule-team";
import type { db } from "~/server";
import { resolveAccounts } from "~/server/people";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Replaces a schedule's assignments with the names in its slot columns,
 * linked to accounts through `resolveAccounts`.
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
  const userIdFor = await resolveAccounts(
    tx,
    slots.map((slot) => slot.name)
  );
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
