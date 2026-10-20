import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";
import { requireAdmin } from "~/server/authz";
import DashboardView from "./dashboard-view";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  await requireAdmin(requestedPath("/admin/dashboard", await searchParams));

  return <DashboardView />;
}
