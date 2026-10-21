import Link from "next/link";
import { Suspense } from "react";
import AdminShell from "~/components/admin/admin-shell";
import ScheduleManager from "~/components/admin/content/schedule-manager";
import { buttonVariants } from "~/components/ui/button";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function ManagementPage() {
  const { role } = await requireAdmin("/admin/schedules");
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      actions={
        <Link className={buttonVariants()} href="/admin/schedules/new">
          Add schedule
        </Link>
      }
      section="Schedules"
      subtitle="Plan gatherings and keep the fellowship informed."
    >
      <Suspense fallback={null}>
        <ScheduleManager />
      </Suspense>
    </AdminShell>
  );
}
