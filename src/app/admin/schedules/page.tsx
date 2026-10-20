import Link from "next/link";
import { redirect } from "next/navigation";
import ScheduleList from "~/app/schedule/schedule-list";
import AdminShell from "~/components/admin/admin-shell";
import { buttonVariants } from "~/components/ui/button";
import { authPageUrl } from "~/lib/auth-redirect";
import { auth } from "~/server/auth";

export default async function ManagementPage() {
  const session = await auth();
  if (!session) {
    redirect(authPageUrl("signin", "/admin/schedules"));
  }
  return (
    <AdminShell section="Schedules">
      <div className="mb-4 flex justify-end">
        <Link
          className={buttonVariants({ variant: "secondary" })}
          href="/admin/schedules/new"
        >
          Add schedule
        </Link>
      </div>
      <ScheduleList management />
    </AdminShell>
  );
}
