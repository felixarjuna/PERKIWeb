import AdminShell from "~/components/admin/admin-shell";
import LibraryImport from "~/components/admin/library/library-import";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function LibraryImportPage() {
  const { role } = await requireAdmin("/admin/library/import");
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      section="Library"
      subtitle="Read the book list and see what changes before importing."
      title="Import from sheet"
    >
      <LibraryImport />
    </AdminShell>
  );
}
