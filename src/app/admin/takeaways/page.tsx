import Link from "next/link";
import TakeawayList from "~/app/takeaway/takeaway-list";
import AdminShell from "~/components/admin/admin-shell";
import { buttonVariants } from "~/components/ui/button";
import { requireAdmin } from "~/server/authz";

export default async function ManagementPage() {
  await requireAdmin("/admin/takeaways");
  return (
    <AdminShell section="Takeaways">
      <div className="mb-4 flex justify-end">
        <Link
          className={buttonVariants({ variant: "secondary" })}
          href="/admin/takeaways/new"
        >
          Add takeaway
        </Link>
      </div>
      <TakeawayList management />
    </AdminShell>
  );
}
