import AdminShell from "~/components/admin/admin-shell";
import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";
import { requireAdmin } from "~/server/authz";
import EditScheduleForm from "./edit-schedule-form";

export default async function EditorPage({
  searchParams,
  params,
}: {
  searchParams: Promise<PageSearchParams>;
  params: Promise<{ id: string }>;
}) {
  await requireAdmin(
    requestedPath(
      `/admin/schedules/${encodeURIComponent((await params).id)}/edit`,
      await searchParams
    )
  );
  return (
    <AdminShell section="Schedules" title="Edit schedule">
      <EditScheduleForm />
    </AdminShell>
  );
}
