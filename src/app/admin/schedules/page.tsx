import Link from "next/link";
import AdminShell from "~/components/admin/admin-shell";
import ScheduleManager from "~/components/admin/content/schedule-manager";
import { buttonVariants } from "~/components/ui/button";
import { requireAdmin } from "~/server/authz";

export default async function ManagementPage() {
  await requireAdmin("/admin/schedules");
  return (
    <AdminShell
      actions={
        <Link className={buttonVariants()} href="/admin/schedules/new">
          Add schedule
        </Link>
      }
      section="Schedules"
      subtitle="Plan gatherings and keep the fellowship informed."
    >
      <ScheduleManager />
    </AdminShell>
  );
}
