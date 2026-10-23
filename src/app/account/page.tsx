import { redirect } from "next/navigation";
import Template from "~/components/template";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import { getRole } from "~/server/authz";
import { api } from "~/trpc/server";
import AccountActions from "./account-actions";
import DutiesCard from "./duties-card";
import ProfileSummary from "./profile-summary";
import RoleCard from "./role-card";
import WhatsappCard from "./whatsapp-card";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const session = await auth();
  if (!session) {
    redirect(
      authPageUrl("signin", requestedPath("/account", await searchParams))
    );
  }

  const [role, duties] = await Promise.all([
    getRole(session.user.id),
    api.schedules.myDuties(),
  ]);
  const canDelete = role !== "owner";

  return (
    <Template
      subtitle="Your details help us care for you as a fellowship."
      title="Your profile"
    >
      <div className="flex w-full flex-col gap-4">
        <ProfileSummary />
        <DutiesCard next={duties.upcoming[0] ?? null} />
        <RoleCard />
        <WhatsappCard />
        <AccountActions canDelete={canDelete} />
      </div>
    </Template>
  );
}
