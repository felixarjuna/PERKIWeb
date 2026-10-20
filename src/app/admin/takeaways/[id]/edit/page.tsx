import AdminShell from "~/components/admin/admin-shell";
import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";
import { requireAdmin } from "~/server/authz";
import EditTakeawayForm from "./edit-takeaway-form";

export default async function EditorPage({
  searchParams,
  params,
}: {
  searchParams: Promise<PageSearchParams>;
  params: Promise<{ id: string }>;
}) {
  await requireAdmin(
    requestedPath(
      `/admin/takeaways/${encodeURIComponent((await params).id)}/edit`,
      await searchParams
    )
  );
  return (
    <AdminShell section="Takeaways" title="Edit takeaway">
      <EditTakeawayForm />
    </AdminShell>
  );
}
