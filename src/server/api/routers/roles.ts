import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { accessRequests, roleChanges, users } from "~/lib/db/schema/schema";
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
