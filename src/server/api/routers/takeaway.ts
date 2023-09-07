import { eq } from "drizzle-orm";
import { takeaways } from "~/db/schema";
import { db } from "~/server";
import {
  addTakeawaySchema,
  queryByIdSchema,
  updateTakeawaySchema,
} from "../schema/schema";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const takeawayRouter = createTRPCRouter({
  getTakeaways: publicProcedure.query(async () => {
    return await db.select().from(takeaways);
  }),
  addTakeaway: publicProcedure
    .input(addTakeawaySchema)
    .mutation(async ({ input }) => {
      return await db.insert(takeaways).values({
        title: input.title,
        takeawayId: input.takeawayId,
        date: input.date,
        speaker: input.speaker,
        bibleVerse: input.bibleVerse,
        summary: input.summary,
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
        .where(eq(takeaways.id, input.id));
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
