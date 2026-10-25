import AdminShell from "~/components/admin/admin-shell";
import PoolImport from "~/components/admin/serving/pool-import";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function PoolImportPage() {
  const { role } = await requireAdmin("/admin/serving/import");
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      section="Serving teams"
      subtitle="Read the sheet's List Pelayan tab and see what changes before importing."
      title="Import from sheet"
    >
      <PoolImport />
    </AdminShell>
  );
}
