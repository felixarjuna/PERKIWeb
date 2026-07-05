import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import DashboardView from "./dashboard-view";

export default async function AdminDashboardPage() {
  // getUserProfiles is a protected procedure: a NextAuth session is required
  // in addition to the client-side admin passcode gate.
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  return <DashboardView />;
}
