import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";
import { adminShellProps, requireAdmin } from "~/server/authz";
import DashboardView from "./dashboard-view";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const { role } = await requireAdmin(
    requestedPath("/admin/dashboard", await searchParams)
  );

  return <DashboardView {...adminShellProps(role)} />;
}
