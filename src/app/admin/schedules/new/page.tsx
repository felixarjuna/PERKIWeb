import { redirect } from "next/navigation";
import AdminShell from "~/components/admin/admin-shell";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import AddScheduleForm from "./add-schedule-form";

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
        requestedPath("/admin/schedules/new", await searchParams)
      )
    );
  }
  return (
    <AdminShell section="Schedules" title="Add schedule">
      <AddScheduleForm />
    </AdminShell>
  );
}
