import Link from "next/link";
import { redirect } from "next/navigation";
import AdminShell from "~/components/admin/admin-shell";
import ScheduleManager from "~/components/admin/content/schedule-manager";
import { buttonVariants } from "~/components/ui/button";
import { authPageUrl } from "~/lib/auth-redirect";
import { auth } from "~/server/auth";

export default async function ManagementPage() {
  if (!(await auth())) {
    redirect(authPageUrl("signin", "/admin/schedules"));
  }
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
