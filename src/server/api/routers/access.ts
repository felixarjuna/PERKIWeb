import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { inviteExpiry, inviteRole } from "~/lib/access";
import {
  accessRequests,
  roleChanges,
  roleInvites,
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
import { openInvite } from "~/server/invites";
import {
  accessRequestSchema,
  decideRequestSchema,
  inviteSchema,
} from "../schema/schema";

/** Invites for people without an account, and members asking for a role. */
export const accessRouter = createTRPCRouter({
  /** Approve or decline an open request. Approval never lowers a role. */
  decide: adminProcedure
    .input(decideRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id;
      return await db.transaction(async (tx) => {
        const [request] = await tx
          .select()
          .from(accessRequests)
          .where(eq(accessRequests.id, input.id))
          .for("update");
        if (!request) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No such request.",
          });
        }
        if (request.status !== "pending") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This request was already answered.",
          });
        }
        const status = input.approve ? "approved" : "declined";
        await tx
          .update(accessRequests)
          .set({ decidedAt: new Date(), decidedById: actorId, status })
          .where(eq(accessRequests.id, request.id));
        if (!input.approve) {
          return { status };
        }
        const [target] = await tx
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, request.userId))
          .for("update");
        const current = normalizeRole(target?.role);
        const role = normalizeRole(request.role);
        // Someone promoted in the meantime keeps the higher role.
        if (current === "member") {
          await tx
            .update(users)
            .set({ role })
            .where(eq(users.id, request.userId));
          await tx.insert(roleChanges).values({
            changedById: actorId,
            fromRole: current,
            source: "request",
            toRole: role,
            userId: request.userId,
          });
        }
        return { status };
      });
    }),
  /** Invite an email to a role; it's given when that email first signs in. */
  invite: adminProcedure
    .input(inviteSchema)
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id;
      if (!canChangeRole(await getRole(actorId), "member", input.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can't give this role.",
        });
      }
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.email}) = ${input.email}`)
        .limit(1);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `${input.email} already has an account. Change their role in Members.`,
        });
      }
      return await db.transaction(async (tx) => {
        // A new invite replaces any earlier one for the same email.
        await tx
          .update(roleInvites)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(roleInvites.email, input.email),
              isNull(roleInvites.acceptedAt),
              isNull(roleInvites.revokedAt)
            )
          );
        const [invite] = await tx
          .insert(roleInvites)
          .values({
            email: input.email,
            expiresAt: inviteExpiry(new Date()),
            invitedById: actorId,
            role: input.role,
          })
          .returning({
            email: roleInvites.email,
            expiresAt: roleInvites.expiresAt,
            id: roleInvites.id,
            role: roleInvites.role,
          });
        if (!invite) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
        return { ...invite, role: input.role };
      });
    }),
  /** Invites still waiting for their person, newest first. */
  invites: adminProcedure.query(async () => {
    const rows = await db
      .select({
        createdAt: roleInvites.createdAt,
        email: roleInvites.email,
        expiresAt: roleInvites.expiresAt,
        id: roleInvites.id,
        invitedByName: users.name,
        role: roleInvites.role,
      })
      .from(roleInvites)
      .leftJoin(users, eq(roleInvites.invitedById, users.id))
      .where(openInvite())
      .orderBy(desc(roleInvites.createdAt), desc(roleInvites.id));
    return rows.map((row) => ({ ...row, role: inviteRole(row.role) }));
  }),
  /** The signed-in member's latest request, or null. */
  myRequest: protectedProcedure.query(async ({ ctx }) => {
    const [request] = await db
      .select({
        createdAt: accessRequests.createdAt,
        role: accessRequests.role,
        status: accessRequests.status,
      })
      .from(accessRequests)
      .where(eq(accessRequests.userId, ctx.session.user.id))
      .orderBy(desc(accessRequests.createdAt), desc(accessRequests.id))
      .limit(1);
    return request ?? null;
  }),
  /** Ask for a role. Asking again while one is open changes nothing. */
  request: protectedProcedure
    .input(accessRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if ((await getRole(userId)) !== "member") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have this access.",
        });
      }
      await db
        .insert(accessRequests)
        .values({ role: input.role, userId })
        .onConflictDoNothing({
          target: accessRequests.userId,
          where: sql`${accessRequests.status} = 'pending'`,
        });
      return { status: "pending" as const };
    }),
  /** Open requests, oldest first, with who asked. */
  requests: adminProcedure.query(
    async () =>
      await db
        .select({
          createdAt: accessRequests.createdAt,
          email: users.email,
          id: accessRequests.id,
          image: users.image,
          name: users.name,
          role: accessRequests.role,
          userId: accessRequests.userId,
        })
        .from(accessRequests)
        .innerJoin(users, eq(accessRequests.userId, users.id))
        .where(eq(accessRequests.status, "pending"))
        .orderBy(asc(accessRequests.createdAt), asc(accessRequests.id))
  ),
  /** Withdraw an invite before it's used. */
  revokeInvite: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db
        .update(roleInvites)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(roleInvites.id, input.id),
            isNull(roleInvites.acceptedAt),
            isNull(roleInvites.revokedAt)
          )
        );
      return { id: input.id };
    }),
});
