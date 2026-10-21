import AdminShell from "~/components/admin/admin-shell";
import AddPrayerDialog from "~/components/admin/prayers/add-prayer-dialog";
import PrayerManager from "~/components/admin/prayers/prayer-manager";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function PrayersManagementPage() {
  const { role } = await requireAdmin("/admin/prayers");
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      actions={<AddPrayerDialog />}
      section="Prayers"
      subtitle="Review requests before they appear on the prayer wall."
    >
      <PrayerManager />
    </AdminShell>
  );
}
