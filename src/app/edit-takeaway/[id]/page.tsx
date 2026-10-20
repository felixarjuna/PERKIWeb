import { redirect } from "next/navigation";
import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";

export default async function LegacyEditorPage({
  searchParams,
  params,
}: {
  searchParams: Promise<PageSearchParams>;
  params: Promise<{ id: string }>;
}) {
  redirect(
    requestedPath(
      `/admin/takeaways/${encodeURIComponent((await params).id)}/edit`,
      await searchParams
    )
  );
}
