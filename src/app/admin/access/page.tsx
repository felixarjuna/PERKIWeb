import AccessManager from "~/components/admin/access/access-manager";
import AdminShell from "~/components/admin/admin-shell";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function AccessPage() {
  const { role } = await requireAdmin("/admin/access");
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      section="Access"
      subtitle="Invite people before they have an account, and answer requests for access."
    >
      <AccessManager />
    </AdminShell>
  );
}
