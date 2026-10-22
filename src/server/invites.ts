import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { normalizeEmail } from "~/lib/access";
import { roleChanges, roleInvites, users } from "~/lib/db/schema/schema";
import { normalizeRole, type Role } from "~/lib/roles";
import { db } from "~/server";

/** Invites that can still be used: not accepted, not revoked, not expired. */
export const openInvite = () =>
  and(
    isNull(roleInvites.acceptedAt),
    isNull(roleInvites.revokedAt),
    gt(roleInvites.expiresAt, sql`now()`)
  );

/**
 * Gives a new account the role it was invited with, recording the inviter in
 * the role history. Runs once, when the account is created. Returns the role
 * given, or null when no open invite matches the email.
 */
export const claimInvite = async (user: {
  email?: string | null;
  id: string;
}): Promise<Role | null> => {
  if (!user.email) {
    return null;
  }
  const email = normalizeEmail(user.email);
  return await db.transaction(async (tx) => {
    const [invite] = await tx
      .select()
      .from(roleInvites)
      .where(and(eq(roleInvites.email, email), openInvite()))
      .for("update");
    if (!invite) {
      return null;
    }
    const [account] = await tx
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .for("update");
    if (!account) {
      return null;
    }
    const current = normalizeRole(account.role);
    const role = normalizeRole(invite.role);
    await tx
      .update(roleInvites)
      .set({ acceptedAt: new Date(), acceptedUserId: user.id })
      .where(eq(roleInvites.id, invite.id));
    // Never touch the owner; an unchanged role needs no history row.
    if (current === "owner" || current === role) {
      return current;
    }
    await tx.update(users).set({ role }).where(eq(users.id, user.id));
    await tx.insert(roleChanges).values({
      changedById: invite.invitedById,
      fromRole: current,
      source: "invite",
      toRole: role,
      userId: user.id,
    });
    return role;
  });
};
