import { eq } from "drizzle-orm";
import {
  type NewSchedule,
  scheduleAssignments,
  schedules,
} from "~/lib/db/schema/schema";
import { slotsFromSchedule } from "~/lib/schedule-team";
import type { db } from "~/server";
import { resolveAccounts } from "~/server/people";
import { resolveSpeakers } from "~/server/speakers";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Replaces a schedule's assignments with the names in its slot columns.
 * Preachers are guest speakers (`resolveSpeakers`); everyone else is linked
 * to a member account (`resolveAccounts`).
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
  const [userIdFor, speakerFor] = await Promise.all([
    resolveAccounts(
      tx,
      slots.filter((slot) => slot.role !== "preacher").map((slot) => slot.name)
    ),
    resolveSpeakers(tx),
  ]);
  await tx
    .insert(scheduleAssignments)
    .values(
      slots.map((slot) =>
        slot.role === "preacher"
          ? { ...slot, scheduleId, speakerId: speakerFor(slot.name) }
          : { ...slot, scheduleId, userId: userIdFor(slot.name) }
      )
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
