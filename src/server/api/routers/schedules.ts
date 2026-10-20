import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { schedules, takeaways } from "~/lib/db/schema/schema";
import { db } from "~/server";
import {
  addScheduleBatchSchema,
  addScheduleSchema,
  queryByIdSchema,
  updateScheduleSchema,
} from "../schema/schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const scheduleRouter = createTRPCRouter({
  addSchedule: protectedProcedure.input(addScheduleSchema).mutation(
    async ({ input }) =>
      await db.insert(schedules).values({
        accommodation: input.accommodation,
        bibleVerse: input.bibleVerse,
        cleaningGroup: input.cleaningGroup,
        cookingGroup: input.cookingGroup,
        date: input.date,
        description: input.description,
        leader: input.leader,
        multimedia: input.multimedia,
        musician: input.musician,
        noteWriter: input.noteWriter,
        preacher: input.preacher,
        title: input.title,
        type: input.type,
      })
  ),
  addScheduleBatch: protectedProcedure
    .input(addScheduleBatchSchema)
    .mutation(
      async ({ input }) => await db.insert(schedules).values([...input])
    ),
  deleteSchedule: protectedProcedure
    .input(queryByIdSchema)
    .mutation(async ({ input }) => {
      const linked = await db
        .select({ id: takeaways.id })
        .from(takeaways)
        .where(eq(takeaways.scheduleId, input.id))
        .limit(1);
      if (linked.length) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Remove the linked takeaways before deleting this schedule.",
        });
      }
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

      if (schedule === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Error occurs when loading schedule from database.",
        });
      }

      return { ...schedule, id: +schedule.id };
    }),
  getSchedules: publicProcedure.query(
    async () => await db.select().from(schedules).orderBy(desc(schedules.date))
  ),
  updateSchedule: protectedProcedure.input(updateScheduleSchema).mutation(
    async ({ input }) =>
      await db
        .update(schedules)
        .set({ ...input })
        .where(eq(schedules.id, input.id))
  ),
});
