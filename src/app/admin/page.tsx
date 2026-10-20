import { redirect } from "next/navigation";
import { getReturnPath, type PageSearchParams } from "~/lib/auth-redirect";

/**
 * Old entry point of the admin area. Access is decided by the signed-in
 * account's role on each admin page, so this only forwards there.
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
  redirect(callback.startsWith("/admin/") ? callback : "/admin/dashboard");
}
