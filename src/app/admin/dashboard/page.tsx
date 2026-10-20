import { redirect } from "next/navigation";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import DashboardView from "./dashboard-view";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  // getUserProfiles is a protected procedure: a NextAuth session is required
  // in addition to the client-side admin passcode gate.
  const session = await auth();
  if (!session) {
    redirect(
      authPageUrl(
        "signin",
        requestedPath("/admin/dashboard", await searchParams)
      )
    );
  }

  return <DashboardView />;
}
