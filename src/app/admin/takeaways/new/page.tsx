import AdminShell from "~/components/admin/admin-shell";
import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";
import { isStaffRole } from "~/lib/roles";
import { getUsernameFromName } from "~/lib/utils";
import { adminShellProps, requireTakeawayAccess } from "~/server/authz";
import NewTakeaway from "./new-takeaway";

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
      {...(await adminShellProps(role))}
      section="Takeaways"
      title="Add takeaway"
    >
      <NewTakeaway
        canImport={isStaffRole(role)}
        username={getUsernameFromName(session.user.name ?? "")}
      />
    </AdminShell>
  );
}
