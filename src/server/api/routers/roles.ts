import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { roleChanges, users } from "~/lib/db/schema/schema";
import { canChangeRole, normalizeRole } from "~/lib/roles";
import { db } from "~/server";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { getRole } from "~/server/authz";
import { setRoleSchema } from "../schema/schema";

export const rolesRouter = createTRPCRouter({
  /** Role history of one person, newest first. */
  getHistory: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const rows = await db
        .select({
          changedByName: users.name,
          createdAt: roleChanges.createdAt,
          fromRole: roleChanges.fromRole,
          toRole: roleChanges.toRole,
        })
        .from(roleChanges)
        .leftJoin(users, eq(roleChanges.changedById, users.id))
        .where(eq(roleChanges.userId, input.userId))
        .orderBy(desc(roleChanges.createdAt), desc(roleChanges.id));
      return rows.map((row) => ({
        changedByName: row.changedByName,
        createdAt: row.createdAt,
        fromRole: normalizeRole(row.fromRole),
        toRole: normalizeRole(row.toRole),
      }));
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
