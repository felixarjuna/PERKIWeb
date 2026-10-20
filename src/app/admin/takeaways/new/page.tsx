import { redirect } from "next/navigation";
import AdminShell from "~/components/admin/admin-shell";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { getUsernameFromName } from "~/lib/utils";
import { auth } from "~/server/auth";
import AddTakeawayForm from "./add-takeaway-form";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const session = await auth();
  if (!session) {
    redirect(
      authPageUrl(
        "signin",
        requestedPath("/admin/takeaways/new", await searchParams)
      )
    );
  }
  return (
    <AdminShell section="Takeaways" title="Add takeaway">
      <AddTakeawayForm
        username={getUsernameFromName(session.user.name ?? "")}
      />
    </AdminShell>
  );
}
