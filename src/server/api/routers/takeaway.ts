import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { schedules, takeaways } from "~/lib/db/schema/schema";
import { db } from "~/server";
import {
  addTakeawaySchema,
  queryByIdSchema,
  updateTakeawaySchema,
} from "../schema/schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const takeawayRouter = createTRPCRouter({
  addTakeaway: protectedProcedure.input(addTakeawaySchema).mutation(
    async ({ input }) =>
      await db.insert(takeaways).values({
        contributors: input.contributors,
        keypoints: input.keypoints,
        scheduleId: input.scheduleId,
      })
  ),
  deleteTakeaway: protectedProcedure
    .input(queryByIdSchema)
    .mutation(
      async ({ input }) =>
        await db.delete(takeaways).where(eq(takeaways.id, input.id))
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
  updateTakeaway: protectedProcedure.input(updateTakeawaySchema).mutation(
    async ({ input }) =>
      await db
        .update(takeaways)
        .set({ ...input })
        .where(eq(takeaways.id, input.id))
  ),
});
