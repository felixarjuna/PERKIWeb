import { schedules } from "~/db/schema";
import { db } from "~/server";
import { addScheduleSchema } from "../schema/schema";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const scheduleRouter = createTRPCRouter({
  getSchedules: publicProcedure.query(async () => {
    return await db.select().from(schedules).orderBy(schedules.date);
  }),
  addSchedule: publicProcedure
    .input(addScheduleSchema)
    .mutation(async ({ input }) => {
      return await db.insert(schedules).values({
        title: input.title,
        date: input.date,
        speaker: input.speaker,
        bibleVerse: input.bibleVerse,
        summary: input.summary,
        liturgos: input.liturgos,
        musician: input.musician,
        multimedia: input.multimedia,
        accommodation: input.accommodation,
        cookingGroup: input.cookingGroup,
        cleaningGroup: input.cleaningGroup,
      });
    }),
});
