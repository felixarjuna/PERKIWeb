import AdminShell from "~/components/admin/admin-shell";
import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";
import { adminShellProps, requireAdmin } from "~/server/authz";
import AddScheduleForm from "./add-schedule-form";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const { role } = await requireAdmin(
    requestedPath("/admin/schedules/new", await searchParams)
  );
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      section="Schedules"
      title="Add schedule"
    >
      <AddScheduleForm />
    </AdminShell>
  );
}
