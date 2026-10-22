import { Plus } from "lucide-react";
import Link from "next/link";
import AdminShell from "~/components/admin/admin-shell";
import TakeawayViews from "~/components/admin/content/takeaway-views";
import { buttonVariants } from "~/components/ui/button";
import { isStaffRole } from "~/lib/roles";
import { adminShellProps, requireTakeawayAccess } from "~/server/authz";

export default async function ManagementPage() {
  const { role } = await requireTakeawayAccess("/admin/takeaways");
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      actions={
        <Link className={buttonVariants()} href="/admin/takeaways/new">
          <Plus aria-hidden="true" data-icon="inline-start">
            <title>Add takeaway</title>
          </Plus>
          Add takeaway
        </Link>
      }
      section="Takeaways"
      subtitle="Share reflections and notes from your gatherings."
    >
      <TakeawayViews staff={isStaffRole(role)} />
    </AdminShell>
  );
}
