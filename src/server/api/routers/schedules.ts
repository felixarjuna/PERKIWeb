import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
  type Schedule,
  scheduleAssignments,
  schedules,
  speakers,
  takeaways,
  users,
} from "~/lib/db/schema/schema";
import { monthsOf } from "~/lib/months";
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
  afterCursor,
  byCursor,
  inWindow,
  matchesWords,
  toPage,
} from "../paging";
import {
  addScheduleBatchSchema,
  addScheduleSchema,
  queryByIdSchema,
  scheduleListSchema,
  scheduleRangeSchema,
  updateScheduleSchema,
} from "../schema/schema";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
  takeawayProcedure,
} from "../trpc";
import { loadGroupTerms } from "./groups";

/**
 * Adds each schedule's team, the members of the groups cooking and cleaning
 * that day, and the ids of its takeaways (oldest first), so a gathering links
 * to its notes. Account ids are never included, and member photos only for
 * signed-in viewers.
 */
async function withTeams(rows: Schedule[], withPhotos: boolean) {
  if (rows.length === 0) {
    return [];
  }
  const ids = rows.map((row) => row.id);
  const [assignments, terms, notes] = await Promise.all([
    db
      .select({
        image: users.image,
        name: scheduleAssignments.name,
        role: scheduleAssignments.role,
        scheduleId: scheduleAssignments.scheduleId,
        speakerPhoto: speakers.photoUrl,
      })
      .from(scheduleAssignments)
      .leftJoin(users, eq(users.id, scheduleAssignments.userId))
      .leftJoin(speakers, eq(speakers.id, scheduleAssignments.speakerId))
      .where(inArray(scheduleAssignments.scheduleId, ids))
      .orderBy(asc(scheduleAssignments.position)),
    loadGroupTerms(withPhotos),
    db
      .select({ id: takeaways.id, scheduleId: takeaways.scheduleId })
      .from(takeaways)
      .where(inArray(takeaways.scheduleId, ids))
      .orderBy(asc(takeaways.id)),
  ]);
  return rows.map((schedule) => {
    const own = assignments.filter((a) => a.scheduleId === schedule.id);
    // Schedules written by the previous release have no assignments yet.
    const team: (Slot & Person)[] =
      own.length > 0
        ? own.map((a) => ({
            // A speaker's photo is public (it's on the landing page); a
            // member's only reaches signed-in viewers.
            image: a.speakerPhoto ?? (withPhotos ? a.image : null),
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
      takeawayIds: notes
        .filter((note) => note.scheduleId === schedule.id)
        .map((note) => note.id),
      team,
    };
  });
}

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
  /** One gathering with its team and takeaways, for its own page. */
  getGathering: publicProcedure
    .input(queryByIdSchema)
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, input.id));
      const [gathering] = await withTeams(rows, Boolean(ctx.session?.user));
      if (!gathering) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found.",
        });
      }
      return gathering;
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
  /** Every schedule in a date window, earliest first, with their teams. */
  inRange: publicProcedure
    .input(scheduleRangeSchema)
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select()
        .from(schedules)
        .where(inWindow(schedules.date, input))
        .orderBy(asc(schedules.date), asc(schedules.id));
      return withTeams(rows, Boolean(ctx.session?.user));
    }),
  /**
   * A page of schedules with their teams, filtered by type, an optional date
   * window and words in the title, passage or a serving name, so members can
   * find a sermon or the gatherings they serve at.
   */
  list: publicProcedure
    .input(scheduleListSchema)
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select()
        .from(schedules)
        .where(
          and(
            input.type === "all" ? undefined : eq(schedules.type, input.type),
            inWindow(schedules.date, input),
            matchesWords(
              [
                schedules.title,
                schedules.bibleVerse,
                schedules.preacher,
                schedules.leader,
                schedules.musician,
                schedules.multimedia,
                schedules.accommodation,
                schedules.noteWriter,
              ],
              input.q
            ),
            afterCursor(schedules.date, schedules.id, input.cursor, input.order)
          )
        )
        .orderBy(...byCursor(schedules.date, schedules.id, input.order))
        .limit(input.limit + 1);
      const page = toPage(rows, input.limit, ({ date, id }) => ({ date, id }));
      return {
        items: await withTeams(page.items, Boolean(ctx.session?.user)),
        nextCursor: page.nextCursor,
      };
    }),
  /** The Aachen months (`yyyy-MM`) with gatherings, newest first, for filters. */
  months: publicProcedure.query(async () =>
    monthsOf(
      (await db.selectDistinct({ date: schedules.date }).from(schedules)).map(
        (row) => row.date
      )
    )
  ),
  /** Every schedule's id, title, verse and date, newest first, for pickers. */
  options: takeawayProcedure.query(() =>
    db
      .select({
        bibleVerse: schedules.bibleVerse,
        date: schedules.date,
        id: schedules.id,
        title: schedules.title,
      })
      .from(schedules)
      .orderBy(desc(schedules.date), desc(schedules.id))
  ),
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
