import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { authPageUrl } from "~/lib/auth-redirect";
import { users } from "~/lib/db/schema/schema";
import { db } from "~/server";
import { auth } from "~/server/auth";

/**
 * Whether the user is an admin. Read from the database on every check (not
 * from the session token) so revoking a role takes effect immediately.
 */
export const isAdmin = async (userId: string): Promise<boolean> => {
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user?.role === "admin";
};

/**
 * Guard for admin pages (server components). Signed-out visitors go to the
 * sign-in page; signed-in members get a 404 so the admin area stays hidden.
 */
export const requireAdmin = async (returnPath: string) => {
  const session = await auth();
  if (!session) {
    redirect(authPageUrl("signin", returnPath));
  }
  if (!(await isAdmin(session.user.id))) {
    notFound();
  }
  return session;
};
