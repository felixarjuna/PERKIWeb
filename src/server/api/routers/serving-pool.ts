import { TRPCError } from "@trpc/server";
import { asc, eq, inArray } from "drizzle-orm";
import { DateTime } from "luxon";
import { z } from "zod";
import { groupTerms, servingPool, users } from "~/lib/db/schema/schema";
import { localDay } from "~/lib/schedule-team";
import {
  addTargets,
  POOL_SCOPES,
  POOL_STATUSES,
  type PoolRole,
  poolEntriesFor,
  poolStatus,
  scopesFor,
  termWindow,
} from "~/lib/serving-pool";
import { db } from "~/server";
import { servedCounts } from "~/server/served-counts";
import { affectedRow } from "../errors";
import { adminProcedure, createTRPCRouter } from "../trpc";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NOTE = 500;
const ids = z.array(z.number().int().positive()).min(1).max(50);

/** Midnight in Aachen at the start of a `yyyy-MM-dd` day. */
const aachenStart = (day: string) =>
  DateTime.fromISO(day, { zone: "Europe/Berlin" }).toJSDate();

const checkScope = (role: PoolRole, scope: string) => {
  if (!(scopesFor(role) as readonly string[]).includes(scope)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That role isn't scheduled for this kind of gathering.",
    });
  }
};

export const servingPoolRouter = createTRPCRouter({
  /** Adds a member to a role; a leader can lead the service, PA Besar or both. */
  add: adminProcedure
    .input(
      z.object({
        group: z.string().refine((value) => addTargets.includes(value)),
        scope: z.enum(POOL_SCOPES).optional(),
        userId: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const entries = poolEntriesFor(input.group);
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, input.userId));
      if (!(entries && user)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found.",
        });
      }
      const rows = entries.map(({ role, scope }) => {
        const chosen = scope ?? input.scope ?? scopesFor(role)[0] ?? "both";
        checkScope(role, chosen);
        return { role, scope: chosen, userId: user.id };
      });
      const added = await db
        .insert(servingPool)
        .values(rows)
        .onConflictDoNothing()
        .returning({ id: servingPool.id });
      if (!added.length) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "They're already in the pool for this role.",
        });
      }
      return added;
    }),
  /**
   * Every pool entry with its member, status, scope and how often they served
   * in that role this group term (schedule slots linked to their account).
   * Staff only: pause notes never leave this endpoint.
   */
  list: adminProcedure.query(async () => {
    const now = new Date();
    const today = localDay(now);
    const term = termWindow(await db.select().from(groupTerms), today);
    const [rows, counts] = await Promise.all([
      db
        .select({
          email: users.email,
          id: servingPool.id,
          image: users.image,
          name: users.name,
          pausedUntil: servingPool.pausedUntil,
          pauseNote: servingPool.pauseNote,
          role: servingPool.role,
          scope: servingPool.scope,
          status: servingPool.status,
          userId: servingPool.userId,
        })
        .from(servingPool)
        .innerJoin(users, eq(users.id, servingPool.userId))
        .orderBy(asc(users.name), asc(servingPool.id)),
      servedCounts(
        term.from ? aachenStart(term.from) : null,
        term.before ? aachenStart(term.before) : now
      ),
    ]);
    const served = new Map(
      counts.map((count) => [`${count.userId} ${count.role}`, count])
    );
    return {
      entries: rows.map((row) => {
        const count = served.get(`${row.userId} ${row.role}`);
        const status = row.status as (typeof POOL_STATUSES)[number];
        return {
          id: row.id,
          lastServed: count?.last ? new Date(count.last) : null,
          pausedUntil: row.pausedUntil,
          pauseNote: row.pauseNote,
          role: row.role as PoolRole,
          scope: row.scope as (typeof POOL_SCOPES)[number],
          servedThisTerm: count?.served ?? 0,
          status: poolStatus({ pausedUntil: row.pausedUntil, status }, today),
          storedStatus: status,
          user: {
            email: row.email,
            id: row.userId,
            image: row.image,
            name: row.name,
          },
        };
      }),
      term,
      today,
    };
  }),
  /** Pauses entries through a day (Aachen), with a note only staff see. */
  pause: adminProcedure
    .input(
      z.object({
        ids,
        note: z.string().trim().max(MAX_NOTE).optional(),
        until: z.string().regex(DAY),
      })
    )
    .mutation(({ input }) => {
      if (input.until < localDay(new Date())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pick today or a later day.",
        });
      }
      return db
        .update(servingPool)
        .set({ pausedUntil: input.until, pauseNote: input.note || null })
        .where(inArray(servingPool.id, input.ids))
        .returning({ id: servingPool.id });
    }),
  remove: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) =>
      affectedRow(
        await db
          .delete(servingPool)
          .where(eq(servingPool.id, input.id))
          .returning({ id: servingPool.id }),
        "Pool entry"
      )
    ),
  /** Ends a pause now and clears its note. */
  resume: adminProcedure
    .input(z.object({ ids }))
    .mutation(({ input }) =>
      db
        .update(servingPool)
        .set({ pausedUntil: null, pauseNote: null })
        .where(inArray(servingPool.id, input.ids))
        .returning({ id: servingPool.id })
    ),
  update: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        scope: z.enum(POOL_SCOPES),
        status: z.enum(POOL_STATUSES),
      })
    )
    .mutation(async ({ input }) => {
      const [entry] = await db
        .select({ role: servingPool.role })
        .from(servingPool)
        .where(eq(servingPool.id, input.id));
      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pool entry not found.",
        });
      }
      checkScope(entry.role as PoolRole, input.scope);
      return affectedRow(
        await db
          .update(servingPool)
          .set({ scope: input.scope, status: input.status })
          .where(eq(servingPool.id, input.id))
          .returning({ id: servingPool.id }),
        "Pool entry"
      );
    }),
});
