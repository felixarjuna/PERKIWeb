import { TRPCError } from "@trpc/server";
import { asc, desc, eq } from "drizzle-orm";
import { scheduleAssignments, schedules, users } from "~/lib/db/schema/schema";
import type { Person } from "~/lib/people";
import {
  localDay,
  type Slot,
  slotsFromSchedule,
  termOn,
} from "~/lib/schedule-team";
import type { ServingRole } from "~/lib/serving-roles";
import { db } from "~/server";
import { insertSchedule, syncAssignments } from "~/server/schedule-assignments";
import { affectedRow } from "../errors";
import {
  addScheduleBatchSchema,
  addScheduleSchema,
  queryByIdSchema,
  updateScheduleSchema,
} from "../schema/schema";
import { adminProcedure, createTRPCRouter, publicProcedure } from "../trpc";
import { loadGroupTerms } from "./groups";

export const scheduleRouter = createTRPCRouter({
  addSchedule: adminProcedure
    .input(addScheduleSchema)
    .mutation(({ input }) => db.transaction((tx) => insertSchedule(tx, input))),
  addScheduleBatch: adminProcedure
    .input(addScheduleBatchSchema)
    .mutation(({ input }) =>
      db.transaction(async (tx) => {
        const rows: { id: number }[] = [];
        for (const schedule of input) {
          // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
          const row = await insertSchedule(tx, schedule);
          if (row) {
            rows.push(row);
          }
        }
        return rows;
      })
    ),
  /** Deleting a schedule also deletes its takeaways (FK `ON DELETE CASCADE`). */
  deleteSchedule: adminProcedure
    .input(queryByIdSchema)
    .mutation(async ({ input }) =>
      affectedRow(
        await db
          .delete(schedules)
          .where(eq(schedules.id, input.id))
          .returning({ id: schedules.id }),
        "Schedule"
      )
    ),
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
  /**
   * Schedules, newest first, with their team and the members of the groups
   * cooking and cleaning that day. Account ids are never included, and
   * photos only for signed-in viewers.
   */
  getSchedules: publicProcedure.query(async ({ ctx }) => {
    const withPhotos = Boolean(ctx.session?.user);
    const [rows, assignments, terms] = await Promise.all([
      db.select().from(schedules).orderBy(desc(schedules.date)),
      db
        .select({
          image: users.image,
          name: scheduleAssignments.name,
          role: scheduleAssignments.role,
          scheduleId: scheduleAssignments.scheduleId,
        })
        .from(scheduleAssignments)
        .leftJoin(users, eq(users.id, scheduleAssignments.userId))
        .orderBy(asc(scheduleAssignments.position)),
      loadGroupTerms(withPhotos),
    ]);
    return rows.map((schedule) => {
      const own = assignments.filter((a) => a.scheduleId === schedule.id);
      // Schedules written by the previous release have no assignments yet.
      const team: (Slot & Person)[] =
        own.length > 0
          ? own.map((a) => ({
              image: withPhotos ? a.image : null,
              name: a.name,
              role: a.role as ServingRole,
            }))
          : slotsFromSchedule(schedule).map((slot) => ({
              ...slot,
              image: null,
            }));
      const term = termOn(terms, localDay(schedule.date));
      const membersOf = (name: string | null) =>
        term?.groups.find(
          (group) => group.name.toLowerCase() === name?.trim().toLowerCase()
        )?.members ?? null;
      return {
        ...schedule,
        groupMembers: {
          cleaning: membersOf(schedule.cleaningGroup),
          cooking: membersOf(schedule.cookingGroup),
        },
        team,
      };
    });
  }),
  updateSchedule: adminProcedure
    .input(updateScheduleSchema)
    .mutation(({ input }) =>
      db.transaction(async (tx) => {
        const row = affectedRow(
          await tx
            .update(schedules)
            .set({ ...input })
            .where(eq(schedules.id, input.id))
            .returning({ id: schedules.id }),
          "Schedule"
        );
        await syncAssignments(tx, input.id, input);
        return row;
      })
    ),
});
