import { redirect } from "next/navigation";
import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";

export default async function LegacyEditorPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  redirect(requestedPath("/admin/schedules/new", await searchParams));
}
