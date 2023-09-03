import { takeaways } from "~/db/schema";
import { db } from "~/server";
import { addTakeawaySchema } from "../schema/schema";
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
});
