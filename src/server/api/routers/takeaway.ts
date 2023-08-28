import { takeaways } from "@/db/schema";
import { db } from "@/server";
import { publicProcedure, router } from "@/server/trpc";
import { addTakeawaySchemaBackend } from "../schema/schema";

export const takeawayRouter = router({
  getTakeaway: publicProcedure.query(async () => {
    return db.select().from(takeaways).all();
  }),
  addTakeaway: publicProcedure.input(addTakeawaySchemaBackend).mutation(async ({ input }) => {
    return db
      .insert(takeaways)
      .values({
        title: input.title,
        takeawayId: input.takeawayId,
        date: input.date.toString(),
        speaker: input.speaker,
        bibleVerse: input.bibleVerse,
        summary: input.summary,
        contributors: input.contributors,
      })
      .run();
  }),
});
