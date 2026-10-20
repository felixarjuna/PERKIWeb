import AdminShell from "~/components/admin/admin-shell";
import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";
import { getUsernameFromName } from "~/lib/utils";
import { requireTakeawayAccess } from "~/server/authz";
import AddTakeawayForm from "./add-takeaway-form";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const { session } = await requireTakeawayAccess(
    requestedPath("/admin/takeaways/new", await searchParams)
  );
  return (
    <AdminShell section="Takeaways" title="Add takeaway">
      <AddTakeawayForm
        username={getUsernameFromName(session.user.name ?? "")}
      />
    </AdminShell>
  );
}
