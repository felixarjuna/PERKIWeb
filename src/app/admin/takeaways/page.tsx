import Link from "next/link";
import AdminShell from "~/components/admin/admin-shell";
import TakeawayManager from "~/components/admin/content/takeaway-manager";
import { buttonVariants } from "~/components/ui/button";
import { requireAdmin } from "~/server/authz";

export default async function ManagementPage() {
  await requireAdmin("/admin/takeaways");
  return (
    <AdminShell
      actions={
        <Link className={buttonVariants()} href="/admin/takeaways/new">
          Add takeaway
        </Link>
      }
      section="Takeaways"
      subtitle="Share reflections and notes from your gatherings."
    >
      <TakeawayManager />
    </AdminShell>
  );
}
