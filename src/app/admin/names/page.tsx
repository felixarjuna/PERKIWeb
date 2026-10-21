import AdminShell from "~/components/admin/admin-shell";
import NameLinks from "~/components/admin/people/name-links";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function NameLinksPage() {
  const { role } = await requireAdmin("/admin/names");
  return (
    <AdminShell
      {...adminShellProps(role)}
      section="Name links"
      subtitle="Connect the names on schedules and in groups to member accounts."
    >
      <NameLinks />
    </AdminShell>
  );
}
