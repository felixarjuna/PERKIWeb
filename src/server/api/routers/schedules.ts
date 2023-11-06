import { eq } from "drizzle-orm";
import { schedules } from "~/lib/db/schema/schedules";
import { db } from "~/server";
import {
  addScheduleSchema,
  queryByIdSchema,
  updateScheduleSchema,
} from "../schema/schema";
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
        fellowshipType: input.fellowshipType,
      });
    }),
  deleteSchedule: publicProcedure
    .input(queryByIdSchema)
    .mutation(async ({ input }) => {
      return await db.delete(schedules).where(eq(schedules.id, input.id));
    }),
  getScheduleById: publicProcedure
    .input(queryByIdSchema)
    .query(async ({ input }) => {
      return await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, input.id));
    }),
  updateSchedule: publicProcedure
    .input(updateScheduleSchema)
    .mutation(async ({ input }) => {
      return await db
        .update(schedules)
        .set({ ...input })
        .where(eq(schedules.id, input.id));
    }),
});
