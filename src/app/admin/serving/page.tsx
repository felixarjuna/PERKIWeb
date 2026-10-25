import Link from "next/link";
import { Suspense } from "react";
import AdminShell from "~/components/admin/admin-shell";
import ServingPool from "~/components/admin/serving/serving-pool";
import { buttonVariants } from "~/components/ui/button";
import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function ServingPoolPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const { role } = await requireAdmin(
    requestedPath("/admin/serving", await searchParams)
  );
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      actions={
        <Link
          className={buttonVariants({ variant: "secondary" })}
          href="/admin/serving/import"
        >
          Import from sheet
        </Link>
      }
      section="Serving pool"
      subtitle="Who can serve in which role, and who has served least this term."
    >
      <Suspense fallback={<p>Loading the serving pool…</p>}>
        <ServingPool />
      </Suspense>
    </AdminShell>
  );
}
