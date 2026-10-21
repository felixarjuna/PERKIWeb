import AdminShell from "~/components/admin/admin-shell";
import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";
import { adminShellProps, requireAdmin } from "~/server/authz";
import AddScheduleForm from "./add-schedule-form";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const params = await searchParams;
  const { role } = await requireAdmin(
    requestedPath("/admin/schedules/new", params)
  );
  // The calendar links an empty day here as ?date=yyyy-MM-dd.
  const day =
    typeof params.date === "string" && DAY.test(params.date)
      ? params.date
      : undefined;
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      section="Schedules"
      title="Add schedule"
    >
      <AddScheduleForm day={day} />
    </AdminShell>
  );
}
