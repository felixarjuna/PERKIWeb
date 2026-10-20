import { redirect } from "next/navigation";
import { getReturnPath, type PageSearchParams } from "~/lib/auth-redirect";
import { canWriteTakeaways, isStaffRole } from "~/lib/roles";
import { auth } from "~/server/auth";
import { getRole } from "~/server/authz";

/**
 * Old entry point of the admin area. Access is decided by the signed-in
 * account's role on each admin page, so this only forwards there. Writers
 * land on the takeaways page, the only admin area they can use.
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const query = await searchParams;
  const callback = getReturnPath(
    typeof query.callbackUrl === "string" ? query.callbackUrl : null
  );
  const session = await auth();
  if (session) {
    const role = await getRole(session.user.id);
    if (canWriteTakeaways(role) && !isStaffRole(role)) {
      redirect("/admin/takeaways");
    }
  }
  redirect(callback.startsWith("/admin/") ? callback : "/admin/dashboard");
}
