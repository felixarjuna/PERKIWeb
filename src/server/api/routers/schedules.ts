import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { schedules } from "~/lib/db/schema/schema";
import { db } from "~/server";
import {
  addScheduleBatchSchema,
  addScheduleSchema,
  queryByIdSchema,
  updateScheduleSchema,
} from "../schema/schema";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const scheduleRouter = createTRPCRouter({
  getSchedules: publicProcedure.query(async () => {
    return await db.select().from(schedules).orderBy(desc(schedules.date));
  }),
  addSchedule: publicProcedure
    .input(addScheduleSchema)
    .mutation(async ({ input }) => {
      return await db.insert(schedules).values({
        title: input.title,
        description: input.description,
        date: input.date,
        type: input.type,
        bibleVerse: input.bibleVerse,
        preacher: input.preacher,
        noteWriter: input.noteWriter,
        leader: input.leader,
        musician: input.musician,
        multimedia: input.multimedia,
        accommodation: input.accommodation,
        cookingGroup: input.cookingGroup,
        cleaningGroup: input.cleaningGroup,
      });
    }),
  addScheduleBatch: publicProcedure
    .input(addScheduleBatchSchema)
    .mutation(async ({ input }) => {
      return await db.insert(schedules).values([...input]);
    }),
  deleteSchedule: publicProcedure
    .input(queryByIdSchema)
    .mutation(async ({ input }) => {
      return await db.delete(schedules).where(eq(schedules.id, input.id));
    }),
  getScheduleById: publicProcedure
    .input(queryByIdSchema)
    .query(async ({ input }) => {
      const schedule = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, input.id))
        .then((res) => res.at(0));

      if (schedule === undefined)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Error occurs when loading schedule from database.",
        });

      return { ...schedule, id: +schedule.id };
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
