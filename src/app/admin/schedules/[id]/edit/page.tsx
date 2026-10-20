import { redirect } from "next/navigation";
import AdminShell from "~/components/admin/admin-shell";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import EditScheduleForm from "./edit-schedule-form";

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
          `/admin/schedules/${encodeURIComponent((await params).id)}/edit`,
          await searchParams
        )
      )
    );
  }
  return (
    <AdminShell section="Schedules" title="Edit schedule">
      <EditScheduleForm />
    </AdminShell>
  );
}
