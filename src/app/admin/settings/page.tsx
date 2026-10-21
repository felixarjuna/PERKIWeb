import AdminShell from "~/components/admin/admin-shell";
import ScheduleSheetSetting from "~/components/admin/settings/schedule-sheet-setting";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function SettingsPage() {
  const { role } = await requireAdmin("/admin/settings");
  return (
    <AdminShell
      {...adminShellProps(role)}
      section="Settings"
      subtitle="Workspace settings you can change without a new release."
    >
      <div className="grid gap-4">
        <ScheduleSheetSetting />
      </div>
    </AdminShell>
  );
}
