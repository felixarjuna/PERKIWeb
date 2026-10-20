import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { authPageUrl } from "~/lib/auth-redirect";
import { users } from "~/lib/db/schema/schema";
import {
  canWriteTakeaways,
  isStaffRole,
  normalizeRole,
  type Role,
} from "~/lib/roles";
import { db } from "~/server";
import { auth } from "~/server/auth";

/**
 * The user's role, read from the database on every check (not from the
 * session token) so changing a role takes effect immediately.
 */
export const getRole = async (userId: string): Promise<Role> => {
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return normalizeRole(user?.role);
};

/**
 * Props every admin page passes to `AdminShell`. Only staff get the Drive
 * URL; `driveConfigured` lets the shell hide the Drive item when no folder
 * is set. Reads the environment directly so server tests can import this
 * module without the full env.
 */
export const adminShellProps = (role: Role) => {
  const driveFolderUrl = process.env.DRIVE_FOLDER_URL || null;
  return {
    driveConfigured: driveFolderUrl !== null,
    driveUrl: isStaffRole(role) ? driveFolderUrl : null,
    viewerRole: role,
  };
};

/** Whether the user is staff (owner or mita). */
export const isAdmin = async (userId: string): Promise<boolean> =>
  isStaffRole(await getRole(userId));

/** Whether the user may write takeaways (staff or writer). */
export const canManageTakeaways = async (userId: string): Promise<boolean> =>
  canWriteTakeaways(await getRole(userId));

const requireRole = async (
  returnPath: string,
  allowed: (role: Role) => boolean
) => {
  const session = await auth();
  if (!session) {
    redirect(authPageUrl("signin", returnPath));
  }
  const role = await getRole(session.user.id);
  if (!allowed(role)) {
    notFound();
  }
  return { role, session };
};

/**
 * Guard for admin pages (server components). Signed-out visitors go to the
 * sign-in page; everyone but staff gets a 404 so the admin area stays hidden.
 */
export const requireAdmin = (returnPath: string) =>
  requireRole(returnPath, isStaffRole);

/** Like `requireAdmin`, but writers may enter too (takeaway pages). */
export const requireTakeawayAccess = (returnPath: string) =>
  requireRole(returnPath, canWriteTakeaways);
