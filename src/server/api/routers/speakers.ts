import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import {
  scheduleAssignments,
  schedules,
  speakers,
} from "~/lib/db/schema/schema";
import { nameKey } from "~/lib/people";
import { db } from "~/server";
import type { Transaction } from "~/server/schedule-assignments";
import { relinkPreachers } from "~/server/speakers";
import { isPgError, PG_UNIQUE_VIOLATION } from "../errors";
import { speakerInput } from "../schema/schema";
import { adminProcedure, createTRPCRouter, publicProcedure } from "../trpc";

/** Normalised spellings without the speaker's own name or duplicates. */
const aliasKeys = (name: string, aliases: string[]) =>
  [...new Set(aliases.map(nameKey))].filter(
    (key) => key && key !== nameKey(name)
  );

/** A spelling may point to one speaker only. */
async function assertSpellingsFree(
  tx: Transaction,
  keys: string[],
  exceptId?: number
) {
  const others = await tx
    .select({ aliases: speakers.aliases, id: speakers.id, name: speakers.name })
    .from(speakers)
    .where(exceptId === undefined ? undefined : ne(speakers.id, exceptId));
  for (const other of others) {
    const taken = keys.find(
      (key) => key === nameKey(other.name) || other.aliases.includes(key)
    );
    if (taken) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `“${taken}” already belongs to ${other.name}.`,
      });
    }
  }
}

const rethrowDuplicate = (error: unknown): never => {
  if (isPgError(error, PG_UNIQUE_VIOLATION)) {
    throw new TRPCError({
      cause: error,
      code: "CONFLICT",
      message: "A speaker with this name already exists.",
    });
  }
  throw error;
};

export const speakerRouter = createTRPCRouter({
  /** Active speakers for the landing page and the preacher picker. */
  active: publicProcedure.query(() =>
    db
      .select({
        favoriteVerse: speakers.favoriteVerse,
        id: speakers.id,
        name: speakers.name,
        photoUrl: speakers.photoUrl,
        story: speakers.story,
      })
      .from(speakers)
      .where(eq(speakers.active, true))
      .orderBy(asc(speakers.id))
  ),
  /** Adds another spelling to a speaker, e.g. from an unmatched preacher name. */
  addSpelling: adminProcedure
    .input(
      z.object({ id: z.number(), name: z.string().trim().min(1).max(100) })
    )
    .mutation(({ input }) =>
      db.transaction(async (tx) => {
        const [speaker] = await tx
          .select()
          .from(speakers)
          .where(eq(speakers.id, input.id));
        if (!speaker) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Speaker not found.",
          });
        }
        const keys = aliasKeys(speaker.name, [...speaker.aliases, input.name]);
        await assertSpellingsFree(tx, [nameKey(input.name)], speaker.id);
        await tx
          .update(speakers)
          .set({ aliases: keys })
          .where(eq(speakers.id, speaker.id));
        await relinkPreachers(tx);
      })
    ),
  /** Every speaker with how often they preached, for the workspace. */
  all: adminProcedure.query(async () => {
    const [rows, slots] = await Promise.all([
      db
        .select()
        .from(speakers)
        .orderBy(desc(speakers.active), asc(speakers.name)),
      db
        .select({ speakerId: scheduleAssignments.speakerId })
        .from(scheduleAssignments)
        .where(eq(scheduleAssignments.role, "preacher")),
    ]);
    return rows.map((speaker) => ({
      ...speaker,
      sermons: slots.filter((slot) => slot.speakerId === speaker.id).length,
    }));
  }),
  create: adminProcedure.input(speakerInput).mutation(({ input }) =>
    db
      .transaction(async (tx) => {
        const aliases = aliasKeys(input.name, input.aliases);
        await assertSpellingsFree(tx, [nameKey(input.name), ...aliases]);
        const [row] = await tx
          .insert(speakers)
          .values({ ...input, aliases })
          .returning({ id: speakers.id });
        await relinkPreachers(tx);
        return row;
      })
      .catch(rethrowDuplicate)
  ),
  /** Preacher names on schedules that match no speaker yet. */
  unmatched: adminProcedure.query(async () => {
    const rows = await db
      .select({ date: schedules.date, name: scheduleAssignments.name })
      .from(scheduleAssignments)
      .innerJoin(schedules, eq(schedules.id, scheduleAssignments.scheduleId))
      .where(
        and(
          eq(scheduleAssignments.role, "preacher"),
          isNull(scheduleAssignments.speakerId)
        )
      )
      .orderBy(desc(schedules.date));
    const byKey = new Map<
      string,
      { count: number; last: Date; name: string }
    >();
    for (const row of rows) {
      const key = nameKey(row.name);
      const entry = byKey.get(key);
      if (entry) {
        entry.count += 1;
      } else {
        byKey.set(key, { count: 1, last: row.date, name: row.name });
      }
    }
    return [...byKey.values()];
  }),
  update: adminProcedure
    .input(speakerInput.extend({ id: z.number() }))
    .mutation(({ input: { id, ...input } }) =>
      db
        .transaction(async (tx) => {
          const aliases = aliasKeys(input.name, input.aliases);
          await assertSpellingsFree(tx, [nameKey(input.name), ...aliases], id);
          const [row] = await tx
            .update(speakers)
            .set({ ...input, aliases })
            .where(eq(speakers.id, id))
            .returning({ id: speakers.id });
          if (!row) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Speaker not found.",
            });
          }
          await relinkPreachers(tx);
          return row;
        })
        .catch(rethrowDuplicate)
    ),
});
