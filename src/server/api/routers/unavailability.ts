import { TRPCError } from "@trpc/server";
import { and, asc, eq, gte, inArray, lt, lte, ne } from "drizzle-orm";
import { DateTime } from "luxon";
import { z } from "zod";
import {
  nameLinks,
  profiles,
  scheduleAssignments,
  schedules,
  servingPool,
  unavailability,
  users,
} from "~/lib/db/schema/schema";
import { localDay } from "~/lib/schedule-team";
import type { ServingRole } from "~/lib/serving-roles";
import { MAX_UNAVAILABLE_NOTE, rangeProblem } from "~/lib/unavailability";
import { db } from "~/server";
import { affectedRow } from "../errors";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "../trpc";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const day = z.string().regex(DAY);

/** Midnight in Aachen at the start of a `yyyy-MM-dd` day. */
const aachenStart = (value: string) =>
  DateTime.fromISO(value, { zone: "Europe/Berlin" });

export const unavailabilityRouter = createTRPCRouter({
  /**
   * The signed-in member marks days they can't serve. Slots they already
   * hold on those days are kept; they're returned so the member knows mita
   * will see a warning there.
   */
  add: protectedProcedure
    .input(
      z.object({
        endsOn: day,
        note: z.string().trim().max(MAX_UNAVAILABLE_NOTE).optional(),
        startsOn: day,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const problem = rangeProblem(input, localDay(new Date()));
      if (problem) {
        throw new TRPCError({ code: "BAD_REQUEST", message: problem });
      }
      const [row] = await db
        .insert(unavailability)
        .values({
          endsOn: input.endsOn,
          note: input.note || null,
          startsOn: input.startsOn,
          userId,
        })
        .returning({ id: unavailability.id });
      const assigned = await db
        .select({
          date: schedules.date,
          role: scheduleAssignments.role,
          title: schedules.title,
        })
        .from(scheduleAssignments)
        .innerJoin(schedules, eq(schedules.id, scheduleAssignments.scheduleId))
        .where(
          and(
            eq(scheduleAssignments.userId, userId),
            eq(schedules.cancelled, false),
            gte(schedules.date, aachenStart(input.startsOn).toJSDate()),
            lt(
              schedules.date,
              aachenStart(input.endsOn).plus({ days: 1 }).toJSDate()
            )
          )
        )
        .orderBy(asc(schedules.date));
      return {
        assigned: assigned.map((slot) => ({
          ...slot,
          role: slot.role as ServingRole,
        })),
        id: row?.id ?? 0,
      };
    }),
  /**
   * The signed-in member's days from today on, with their own notes, and
   * whether they're in the serving pool (so the page offers marking days).
   */
  mine: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const [ranges, pool] = await Promise.all([
      db
        .select({
          endsOn: unavailability.endsOn,
          id: unavailability.id,
          note: unavailability.note,
          startsOn: unavailability.startsOn,
        })
        .from(unavailability)
        .where(
          and(
            eq(unavailability.userId, userId),
            gte(unavailability.endsOn, localDay(new Date()))
          )
        )
        .orderBy(asc(unavailability.startsOn), asc(unavailability.id)),
      db
        .select({ id: servingPool.id })
        .from(servingPool)
        .where(eq(servingPool.userId, userId))
        .limit(1),
    ]);
    return { inPool: pool.length > 0, ranges };
  }),
  /**
   * Staff only: everyone who can't serve on an Aachen day, with their note
   * and every spelling the schedule may write them by (account name,
   * nickname, saved name links, names on past slots), for the slot pickers.
   */
  onDay: adminProcedure.input(z.object({ day })).query(async ({ input }) => {
    const rows = await db
      .select({
        endsOn: unavailability.endsOn,
        name: users.name,
        nickname: profiles.nickname,
        note: unavailability.note,
        startsOn: unavailability.startsOn,
        userId: unavailability.userId,
      })
      .from(unavailability)
      .innerJoin(users, eq(users.id, unavailability.userId))
      .leftJoin(profiles, eq(profiles.userId, unavailability.userId))
      .where(
        and(
          lte(unavailability.startsOn, input.day),
          gte(unavailability.endsOn, input.day)
        )
      )
      .orderBy(asc(unavailability.startsOn), asc(unavailability.id));
    if (rows.length === 0) {
      return [];
    }
    const userIds = [...new Set(rows.map((row) => row.userId))];
    const [links, written] = await Promise.all([
      db
        .select({ name: nameLinks.name, userId: nameLinks.userId })
        .from(nameLinks)
        .where(inArray(nameLinks.userId, userIds)),
      db
        .selectDistinct({
          name: scheduleAssignments.name,
          userId: scheduleAssignments.userId,
        })
        .from(scheduleAssignments)
        .where(
          and(
            inArray(scheduleAssignments.userId, userIds),
            ne(scheduleAssignments.role, "preacher")
          )
        ),
    ]);
    return rows.map((row) => ({
      endsOn: row.endsOn,
      name: row.name ?? row.nickname ?? "Member",
      names: [
        ...new Set(
          [
            row.name,
            row.nickname,
            ...links
              .filter((link) => link.userId === row.userId)
              .map((link) => link.name),
            ...written
              .filter((slot) => slot.userId === row.userId)
              .map((slot) => slot.name),
          ].filter((name): name is string => Boolean(name?.trim()))
        ),
      ],
      note: row.note,
      startsOn: row.startsOn,
    }));
  }),
  /** The member removes one of their own entries; anyone else's is not found. */
  remove: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) =>
      affectedRow(
        await db
          .delete(unavailability)
          .where(
            and(
              eq(unavailability.id, input.id),
              eq(unavailability.userId, ctx.session.user.id)
            )
          )
          .returning({ id: unavailability.id }),
        "Unavailable date"
      )
    ),
});
