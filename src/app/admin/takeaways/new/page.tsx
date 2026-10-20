import AdminShell from "~/components/admin/admin-shell";
import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";
import { getUsernameFromName } from "~/lib/utils";
import { adminShellProps, requireTakeawayAccess } from "~/server/authz";
import AddTakeawayForm from "./add-takeaway-form";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const { role, session } = await requireTakeawayAccess(
    requestedPath("/admin/takeaways/new", await searchParams)
  );
  return (
    <AdminShell
      {...adminShellProps(role)}
      section="Takeaways"
      title="Add takeaway"
    >
      <AddTakeawayForm
        username={getUsernameFromName(session.user.name ?? "")}
      />
    </AdminShell>
  );
}
