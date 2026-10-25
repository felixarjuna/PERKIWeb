import { Suspense } from "react";
import AdminShell from "~/components/admin/admin-shell";
import AddScheduleMenu from "~/components/admin/content/add-schedule-menu";
import ScheduleManager from "~/components/admin/content/schedule-manager";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function ManagementPage() {
  const { role } = await requireAdmin("/admin/schedules");
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      actions={<AddScheduleMenu />}
      section="Schedules"
      subtitle="Plan gatherings and keep the fellowship informed."
    >
      <Suspense fallback={null}>
        <ScheduleManager />
      </Suspense>
    </AdminShell>
  );
}
