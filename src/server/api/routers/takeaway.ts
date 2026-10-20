import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { schedules, takeaways } from "~/lib/db/schema/schema";
import { db } from "~/server";
import { affectedRow, isPgError, PG_FOREIGN_KEY_VIOLATION } from "../errors";
import {
  addTakeawaySchema,
  queryByIdSchema,
  updateTakeawaySchema,
} from "../schema/schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

/** Maps a write that references a missing schedule to NOT_FOUND. */
const rethrowMissingSchedule = (error: unknown): never => {
  if (isPgError(error, PG_FOREIGN_KEY_VIOLATION)) {
    throw new TRPCError({
      cause: error,
      code: "NOT_FOUND",
      message: "Schedule not found.",
    });
  }
  throw error;
};

export const takeawayRouter = createTRPCRouter({
  addTakeaway: protectedProcedure.input(addTakeawaySchema).mutation(
    async ({ input }) =>
      await db
        .insert(takeaways)
        .values({
          contributors: input.contributors,
          keypoints: input.keypoints,
          scheduleId: input.scheduleId,
        })
        .catch(rethrowMissingSchedule)
  ),
  deleteTakeaway: protectedProcedure
    .input(queryByIdSchema)
    .mutation(async ({ input }) =>
      affectedRow(
        await db
          .delete(takeaways)
          .where(eq(takeaways.id, input.id))
          .returning({ id: takeaways.id }),
        "Takeaway"
      )
    ),
  getTakeawayById: publicProcedure
    .input(queryByIdSchema)
    .query(async ({ input }) => {
      const takeaway = await db
        .select()
        .from(takeaways)
        .where(eq(takeaways.id, input.id))
        .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId))
        .then((data) => data.at(0));

      if (takeaway === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Error occurs when loading takeaway from database.",
        });
      }

      return takeaway;
    }),
  getTakeaways: publicProcedure.query(
    async () =>
      await db
        .select()
        .from(takeaways)
        .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId))
        .orderBy(desc(schedules.date))
  ),
  updateTakeaway: protectedProcedure
    .input(updateTakeawaySchema)
    .mutation(async ({ input }) =>
      affectedRow(
        await db
          .update(takeaways)
          .set({ ...input })
          .where(eq(takeaways.id, input.id))
          .returning({ id: takeaways.id })
          .catch(rethrowMissingSchedule),
        "Takeaway"
      )
    ),
});
