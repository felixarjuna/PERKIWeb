import { redirect } from "next/navigation";
import AdminShell from "~/components/admin/admin-shell";
import PrayerManager from "~/components/admin/prayers/prayer-manager";
import { authPageUrl } from "~/lib/auth-redirect";
import { auth } from "~/server/auth";

export default async function PrayersManagementPage() {
  if (!(await auth())) {
    redirect(authPageUrl("signin", "/admin/prayers"));
  }
  return (
    <AdminShell
      section="Prayers"
      subtitle="Care for your community through prayer. Review requests before sharing them publicly."
    >
      <PrayerManager />
    </AdminShell>
  );
}
