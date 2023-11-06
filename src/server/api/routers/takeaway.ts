import { eq } from "drizzle-orm";
import { schedules } from "~/lib/db/schema/schedules";
import { takeaways } from "~/lib/db/schema/takeaways";
import { db } from "~/server";
import {
  addTakeawaySchema,
  queryByIdSchema,
  updateTakeawaySchema,
} from "../schema/schema";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const takeawayRouter = createTRPCRouter({
  getTakeaways: publicProcedure.query(async () => {
    return await db
      .select()
      .from(takeaways)
      .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId));
  }),
  addTakeaway: publicProcedure
    .input(addTakeawaySchema)
    .mutation(async ({ input }) => {
      return await db.insert(takeaways).values({
        scheduleId: input.scheduleId,
        keypoints: input.keypoints,
        contributors: input.contributors,
      });
    }),
  deleteTakeaway: publicProcedure
    .input(queryByIdSchema)
    .mutation(async ({ input }) => {
      return await db.delete(takeaways).where(eq(takeaways.id, input.id));
    }),
  getTakeawayById: publicProcedure
    .input(queryByIdSchema)
    .query(async ({ input }) => {
      return await db
        .select()
        .from(takeaways)
        .where(eq(takeaways.id, input.id))
        .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId));
    }),
  updateTakeaway: publicProcedure
    .input(updateTakeawaySchema)
    .mutation(async ({ input }) => {
      return await db
        .update(takeaways)
        .set({ ...input })
        .where(eq(takeaways.id, input.id));
    }),
});
