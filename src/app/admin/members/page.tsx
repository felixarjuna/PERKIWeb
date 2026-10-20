import { Suspense } from "react";
import AdminShell from "~/components/admin/admin-shell";
import MemberDirectory from "~/components/admin/members/member-directory";
import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";
import { requireAdmin } from "~/server/authz";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  await requireAdmin(requestedPath("/admin/members", await searchParams));
  return (
    <AdminShell
      section="Members"
      subtitle="Find your people, keep in touch, and get to know your community."
    >
      <Suspense fallback={<p>Loading members…</p>}>
        <MemberDirectory />
      </Suspense>
    </AdminShell>
  );
}
