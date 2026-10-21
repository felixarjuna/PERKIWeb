import { TRPCError } from "@trpc/server";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
  type NewSchedule,
  scheduleAssignments,
  schedules,
  users,
} from "~/lib/db/schema/schema";
import {
  localDay,
  type Slot,
  slotsFromSchedule,
  termOn,
} from "~/lib/schedule-team";
import type { ServingRole } from "~/lib/serving-roles";
import { db } from "~/server";
import { affectedRow } from "../errors";
import {
  addScheduleBatchSchema,
  addScheduleSchema,
  queryByIdSchema,
  updateScheduleSchema,
} from "../schema/schema";
import { adminProcedure, createTRPCRouter, publicProcedure } from "../trpc";
import { loadGroupTerms } from "./groups";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Replaces a schedule's assignments with the names in its slot columns. A
 * name is linked to an account only when exactly one user has that name.
 */
async function syncAssignments(
  tx: Transaction,
  scheduleId: number,
  schedule: NewSchedule
) {
  await tx
    .delete(scheduleAssignments)
    .where(eq(scheduleAssignments.scheduleId, scheduleId));
  const slots = slotsFromSchedule(schedule);
  if (slots.length === 0) {
    return;
  }
  const names = [...new Set(slots.map((slot) => slot.name.toLowerCase()))];
  const matches = await tx
    .select({ id: users.id, name: sql<string>`lower(${users.name})` })
    .from(users)
    .where(inArray(sql`lower(${users.name})`, names));
  const userIdFor = (name: string) => {
    const found = matches.filter((user) => user.name === name.toLowerCase());
    return found.length === 1 ? found[0]?.id : undefined;
  };
  await tx.insert(scheduleAssignments).values(
    slots.map((slot) => ({
      name: slot.name,
      role: slot.role,
      scheduleId,
      userId: userIdFor(slot.name),
    }))
  );
}

const insertSchedule = (tx: Transaction, schedule: NewSchedule) =>
  tx
    .insert(schedules)
    .values(schedule)
    .returning({ id: schedules.id })
    .then(async ([row]) => {
      if (row) {
        await syncAssignments(tx, row.id, schedule);
      }
      return row;
    });

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
   * cooking and cleaning that day. Account ids are never included.
   */
  getSchedules: publicProcedure.query(async () => {
    const [rows, assignments, terms] = await Promise.all([
      db.select().from(schedules).orderBy(desc(schedules.date)),
      db
        .select({
          name: scheduleAssignments.name,
          role: scheduleAssignments.role,
          scheduleId: scheduleAssignments.scheduleId,
        })
        .from(scheduleAssignments)
        .orderBy(asc(scheduleAssignments.position)),
      loadGroupTerms(),
    ]);
    return rows.map((schedule) => {
      const own = assignments.filter((a) => a.scheduleId === schedule.id);
      // Schedules written by the previous release have no assignments yet.
      const team: Slot[] =
        own.length > 0
          ? own.map((a) => ({ name: a.name, role: a.role as ServingRole }))
          : slotsFromSchedule(schedule);
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
