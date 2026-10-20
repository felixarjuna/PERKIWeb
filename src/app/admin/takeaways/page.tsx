import Link from "next/link";
import { redirect } from "next/navigation";
import TakeawayList from "~/app/takeaway/takeaway-list";
import AdminShell from "~/components/admin/admin-shell";
import { buttonVariants } from "~/components/ui/button";
import { authPageUrl } from "~/lib/auth-redirect";
import { auth } from "~/server/auth";

export default async function ManagementPage() {
  const session = await auth();
  if (!session) {
    redirect(authPageUrl("signin", "/admin/takeaways"));
  }
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
