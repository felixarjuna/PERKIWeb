import { Suspense } from "react";
import AdminShell from "~/components/admin/admin-shell";
import PlanGrid from "~/components/admin/content/plan-grid";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function PlanPage() {
  const { role } = await requireAdmin("/admin/schedules/plan");
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      section="Schedules"
      subtitle="Fill the coming months like the sheet. Every pick saves straight away."
      title="Plan months"
    >
      <Suspense fallback={null}>
        <PlanGrid />
      </Suspense>
    </AdminShell>
  );
}
