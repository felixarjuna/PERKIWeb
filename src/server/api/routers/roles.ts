import { TRPCError } from "@trpc/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import {
  accessRequests,
  profiles,
  roleChanges,
  users,
} from "~/lib/db/schema/schema";
import { canChangeRole, normalizeRole } from "~/lib/roles";
import { db } from "~/server";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { getRole } from "~/server/authz";
import { setRoleSchema } from "../schema/schema";

/** How a history entry came about; null is a change made by hand. */
const historySource = (stored: string | null): "invite" | "request" | null =>
  stored === "invite" || stored === "request" ? stored : null;

const validTime = (date: Date | null | undefined) =>
  date && Number.isFinite(date.getTime()) ? date : null;

/**
 * When someone joined, like `signedUpAt` on the dashboard: the earliest of
 * their account and profile dates. An instant another row shares is the
 * migration 0006 backfill, so it only says they joined by then.
 */
async function joinedAt(userId: string) {
  const [[account], [profile]] = await Promise.all([
    db
      .select({ createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId)),
    db
      .select({ createdAt: profiles.createdAt })
      .from(profiles)
      .where(eq(profiles.userId, userId)),
  ]);
  const accountAt = validTime(account?.createdAt);
  const profileAt = validTime(profile?.createdAt);
  const [accountShared, profileShared] = await Promise.all([
    accountAt
      ? db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.createdAt, accountAt), ne(users.id, userId)))
          .limit(1)
      : [],
    profileAt
      ? db
          .select({ id: profiles.id })
          .from(profiles)
          .where(
            and(eq(profiles.createdAt, profileAt), ne(profiles.userId, userId))
          )
          .limit(1)
      : [],
  ]);
  const dates = [
    { at: accountAt, exact: accountShared.length === 0 },
    { at: profileAt, exact: profileShared.length === 0 },
  ].filter((date): date is { at: Date; exact: boolean } => date.at !== null);
  const earliest = (list: typeof dates) =>
    list.reduce<(typeof dates)[number] | null>(
      (first, date) => (!first || date.at < first.at ? date : first),
      null
    );
  return earliest(dates.filter((date) => date.exact)) ?? earliest(dates);
}

export const rolesRouter = createTRPCRouter({
  /**
   * Role history of one person, newest first: every change (by hand, from an
   * invite or an approved request) and every declined request.
   */
  getHistory: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const [changes, declined] = await Promise.all([
        db
          .select({
            changedByName: users.name,
            createdAt: roleChanges.createdAt,
            fromRole: roleChanges.fromRole,
            id: roleChanges.id,
            source: roleChanges.source,
            toRole: roleChanges.toRole,
          })
          .from(roleChanges)
          .leftJoin(users, eq(roleChanges.changedById, users.id))
          .where(eq(roleChanges.userId, input.userId)),
        db
          .select({
            changedByName: users.name,
            decidedAt: accessRequests.decidedAt,
            id: accessRequests.id,
            role: accessRequests.role,
          })
          .from(accessRequests)
          .leftJoin(users, eq(accessRequests.decidedById, users.id))
          .where(
            and(
              eq(accessRequests.userId, input.userId),
              eq(accessRequests.status, "declined")
            )
          ),
      ]);
      const entries = [
        ...changes.map((row) => ({
          changedByName: row.changedByName,
          createdAt: row.createdAt,
          fromRole: normalizeRole(row.fromRole),
          id: row.id,
          key: `change-${row.id}`,
          source: historySource(row.source),
          toRole: normalizeRole(row.toRole),
        })),
        ...declined.map((row) => ({
          changedByName: row.changedByName,
          createdAt: row.decidedAt ?? new Date(0),
          fromRole: normalizeRole(row.role),
          id: row.id,
          key: `declined-${row.id}`,
          source: "declined" as const,
          toRole: normalizeRole(row.role),
        })),
      ];
      return entries
        .sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id
        )
        .map(({ id: _id, ...entry }) => entry);
    }),
  /**
   * The caller's own time in the fellowship: when they joined and every
   * change of their role, newest first. Who made a change stays with staff.
   */
  myHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const [joined, changes] = await Promise.all([
      joinedAt(userId),
      db
        .select({
          createdAt: roleChanges.createdAt,
          fromRole: roleChanges.fromRole,
          id: roleChanges.id,
          source: roleChanges.source,
          toRole: roleChanges.toRole,
        })
        .from(roleChanges)
        .where(eq(roleChanges.userId, userId))
        .orderBy(desc(roleChanges.createdAt), desc(roleChanges.id)),
    ]);
    return {
      changes: changes.map((row) => ({
        createdAt: row.createdAt,
        fromRole: normalizeRole(row.fromRole),
        id: row.id,
        source: historySource(row.source),
        toRole: normalizeRole(row.toRole),
      })),
      joined,
    };
  }),
  /** The signed-in user's current role. */
  myRole: protectedProcedure.query(
    async ({ ctx }) => await getRole(ctx.session.user.id)
  ),
  /** Change someone's role. The owner never changes and is never assigned. */
  setRole: adminProcedure
    .input(setRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id;
      return await db.transaction(async (tx) => {
        const [target] = await tx
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, input.userId))
          .for("update");
        if (!target) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No such user." });
        }
        const [actor] = await tx
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, actorId));
        const current = normalizeRole(target.role);
        if (!canChangeRole(normalizeRole(actor?.role), current, input.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can't change this role.",
          });
        }
        if (current === input.role) {
          return { role: current };
        }
        await tx
          .update(users)
          .set({ role: input.role })
          .where(eq(users.id, input.userId));
        await tx.insert(roleChanges).values({
          changedById: actorId,
          fromRole: current,
          toRole: input.role,
          userId: input.userId,
        });
        return { role: input.role };
      });
    }),
});
