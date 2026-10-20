import { redirect } from "next/navigation";
import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";

export default async function LegacyEditorPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  redirect(requestedPath("/admin/takeaways/new", await searchParams));
}
