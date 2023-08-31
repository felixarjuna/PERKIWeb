import { takeaways } from "@/db/schema";
import { db } from "@/server";
import { publicProcedure, router } from "@/server/trpc";
import { addTakeawaySchema } from "../schema/schema";

export const takeawayRouter = router({
  getTakeaways: publicProcedure.query(() => {
    return db.select().from(takeaways);
  }),
  addTakeaway: publicProcedure.input(addTakeawaySchema).mutation(({ input }) => {
    return db.insert(takeaways).values({
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
