import Link from "next/link";
import { redirect } from "next/navigation";
import AdminShell from "~/components/admin/admin-shell";
import TakeawayManager from "~/components/admin/content/takeaway-manager";
import { buttonVariants } from "~/components/ui/button";
import { authPageUrl } from "~/lib/auth-redirect";
import { auth } from "~/server/auth";

export default async function ManagementPage() {
  if (!(await auth())) {
    redirect(authPageUrl("signin", "/admin/takeaways"));
  }
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
