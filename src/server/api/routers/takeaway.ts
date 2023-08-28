import { takeaways } from "@/db/schema";
import { db } from "@/server";
import { publicProcedure, router } from "@/server/trpc";
import { takeawaySchema } from "../schema/schema";

export const takeawayRouter = router({
  getTakeaway: publicProcedure.query(async () => {
    return db.select().from(takeaways).all();
  }),
  addTakeaway: publicProcedure.input(takeawaySchema).mutation(async ({ input }) => {
    return db
      .insert(takeaways)
      .values({
        title: input.title,
        date: input.date.toString(),
        speaker: input.speaker,
        bibleVerse: input.bibleVerse,
        summary: input.summary,
        contributors: input.contributors,
      })
      .run();
  }),
});
