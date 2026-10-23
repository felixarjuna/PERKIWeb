import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "~/components/admin/admin-shell";
import { TakeawayComments } from "~/components/admin/content/takeaway-comments";
import { buttonVariants } from "~/components/ui/button";
import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";
import { canManageTakeaway } from "~/server/api/routers/takeaway";
import { adminShellProps, requireTakeawayAccess } from "~/server/authz";
import EditTakeawayForm from "./edit-takeaway-form";

export default async function EditorPage({
  searchParams,
  params,
}: {
  searchParams: Promise<PageSearchParams>;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { role, session } = await requireTakeawayAccess(
    requestedPath(
      `/admin/takeaways/${encodeURIComponent(id)}/edit`,
      await searchParams
    )
  );
  const takeawayId = Number(id);
  if (
    !(
      Number.isSafeInteger(takeawayId) &&
      (await canManageTakeaway(takeawayId, session.user.id))
    )
  ) {
    notFound();
  }
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      actions={
        <Link
          className={buttonVariants({ variant: "ghost" })}
          href={`/admin/takeaways/${takeawayId}`}
        >
          <MessageSquare aria-hidden="true" data-icon="inline-start">
            <title>Review and comments</title>
          </MessageSquare>
          Review and comments
        </Link>
      }
      section="Takeaways"
      title="Edit takeaway"
    >
      <EditTakeawayForm />
      <TakeawayComments takeawayId={takeawayId} />
    </AdminShell>
  );
}
