import { eq, inArray } from "drizzle-orm";
import { scheduleAssignments, speakers } from "~/lib/db/schema/schema";
import { nameKey } from "~/lib/people";
import type { Transaction } from "~/server/schedule-assignments";

/** The speaker a written preacher name means: by their name or one of their other spellings. */
export async function resolveSpeakers(tx: Transaction) {
  const rows = await tx
    .select({ aliases: speakers.aliases, id: speakers.id, name: speakers.name })
    .from(speakers);
  const speakerFor = new Map<string, number>();
  for (const speaker of rows) {
    for (const key of [nameKey(speaker.name), ...speaker.aliases]) {
      speakerFor.set(key, speaker.id);
    }
  }
  return (name: string) => speakerFor.get(nameKey(name));
}

/** Re-points every preacher slot after speakers or their spellings change. */
export async function relinkPreachers(tx: Transaction) {
  const [speakerFor, slots] = await Promise.all([
    resolveSpeakers(tx),
    tx
      .select({
        id: scheduleAssignments.id,
        name: scheduleAssignments.name,
        speakerId: scheduleAssignments.speakerId,
      })
      .from(scheduleAssignments)
      .where(eq(scheduleAssignments.role, "preacher")),
  ]);
  const changes = new Map<number | null, number[]>();
  for (const slot of slots) {
    const speakerId = speakerFor(slot.name) ?? null;
    if (speakerId !== slot.speakerId) {
      changes.set(speakerId, [...(changes.get(speakerId) ?? []), slot.id]);
    }
  }
  for (const [speakerId, ids] of changes) {
    // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
    await tx
      .update(scheduleAssignments)
      .set({ speakerId })
      .where(inArray(scheduleAssignments.id, ids));
  }
}
