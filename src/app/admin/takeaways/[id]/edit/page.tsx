import { notFound } from "next/navigation";
import AdminShell from "~/components/admin/admin-shell";
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
      section="Takeaways"
      title="Edit takeaway"
    >
      <EditTakeawayForm />
    </AdminShell>
  );
}
