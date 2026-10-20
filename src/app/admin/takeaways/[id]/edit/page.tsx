import { redirect } from "next/navigation";
import AdminShell from "~/components/admin/admin-shell";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import EditTakeawayForm from "./edit-takeaway-form";

export default async function EditorPage({
  searchParams,
  params,
}: {
  searchParams: Promise<PageSearchParams>;
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect(
      authPageUrl(
        "signin",
        requestedPath(
          `/admin/takeaways/${encodeURIComponent((await params).id)}/edit`,
          await searchParams
        )
      )
    );
  }
  return (
    <AdminShell section="Takeaways" title="Edit takeaway">
      <EditTakeawayForm />
    </AdminShell>
  );
}
