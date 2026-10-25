import AdminShell from "~/components/admin/admin-shell";
import GroupManager from "~/components/admin/groups/group-manager";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function GroupsPage() {
  const { role } = await requireAdmin("/admin/groups");
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      section="Cooking & cleaning"
      subtitle="The cooking and cleaning groups, term by term."
    >
      <GroupManager />
    </AdminShell>
  );
}
