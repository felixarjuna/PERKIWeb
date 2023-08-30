import { schedules } from "@/db/schema";
import { db } from "@/server";
import { publicProcedure, router } from "@/server/trpc";
import { addScheduleSchemaBackend } from "../schema/schema";

export const scheduleRouter = router({
  getSchedules: publicProcedure.query(async () => {
    return db
      .select()
      .from(schedules)
      .all()
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  }),
  addSchedule: publicProcedure.input(addScheduleSchemaBackend).mutation(async ({ input }) => {
    return db
      .insert(schedules)
      .values({
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
      })
      .run();
  }),
});
