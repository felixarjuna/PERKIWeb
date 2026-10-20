import Link from "next/link";
import ScheduleList from "~/app/schedule/schedule-list";
import AdminShell from "~/components/admin/admin-shell";
import { buttonVariants } from "~/components/ui/button";
import { requireAdmin } from "~/server/authz";

export default async function ManagementPage() {
  await requireAdmin("/admin/schedules");
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
