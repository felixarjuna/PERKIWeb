import AdminShell from "~/components/admin/admin-shell";
import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";
import { requireAdmin } from "~/server/authz";
import AddScheduleForm from "./add-schedule-form";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  await requireAdmin(requestedPath("/admin/schedules/new", await searchParams));
  return (
    <AdminShell section="Schedules" title="Add schedule">
      <AddScheduleForm />
    </AdminShell>
  );
}
