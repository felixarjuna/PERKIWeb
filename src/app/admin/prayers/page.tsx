import { redirect } from "next/navigation";
import AdminShell from "~/components/admin/admin-shell";
import AddPrayerDialog from "~/components/admin/prayers/add-prayer-dialog";
import PrayerManager from "~/components/admin/prayers/prayer-manager";
import { authPageUrl } from "~/lib/auth-redirect";
import { auth } from "~/server/auth";

export default async function PrayersManagementPage() {
  if (!(await auth())) {
    redirect(authPageUrl("signin", "/admin/prayers"));
  }
  return (
    <AdminShell
      actions={<AddPrayerDialog />}
      section="Prayers"
      subtitle="Review requests before they appear on the prayer wall."
    >
      <PrayerManager />
    </AdminShell>
  );
}
