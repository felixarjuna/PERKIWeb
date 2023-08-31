import { schedules } from "@/db/schema";
import { db } from "@/server";
import { publicProcedure, router } from "@/server/trpc";
import { addScheduleSchema } from "../schema/schema";

export const scheduleRouter = router({
  getSchedules: publicProcedure.query(() => {
    return db.select().from(schedules).orderBy(schedules.date);
  }),
  addSchedule: publicProcedure.input(addScheduleSchema).mutation(({ input }) => {
    return db.insert(schedules).values({
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
