import Link from "next/link";
import { Suspense } from "react";
import AdminShell from "~/components/admin/admin-shell";
import LibraryShelf from "~/components/admin/library/library-shelf";
import Loader from "~/components/loader";
import { buttonVariants } from "~/components/ui/button";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function AdminLibraryPage() {
  const { role } = await requireAdmin("/admin/library");
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      actions={
        <Link
          className={buttonVariants({ variant: "secondary" })}
          href="/admin/library/import"
        >
          Import from sheet
        </Link>
      }
      section="Library"
      subtitle="The books members can borrow, who lent them and where they are."
    >
      {/* The shelf reads its filters from the URL, which needs a boundary. */}
      <Suspense fallback={<Loader message="Loading books…" />}>
        <LibraryShelf />
      </Suspense>
    </AdminShell>
  );
}
