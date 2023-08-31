import { publicProcedure, router } from "@/server/trpc";
import { addTakeawaySchema } from "../schema/schema";

export const takeawayRouter = router({
  getTakeaways: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.takeaways.findMany({ include: { contributors: true } });
  }),
  addTakeaway: publicProcedure.input(addTakeawaySchema).mutation(({ ctx, input }) => {
    return ctx.prisma.takeaways.create({
      data: {
        title: input.title,
        takeawayId: input.takeawayId,
        date: input.date,
        speaker: input.speaker,
        bibleVerse: input.bibleVerse,
        summary: input.summary,
        contributors: { connect: { id: input.contributorId } },
      },
    });
  }),
});
