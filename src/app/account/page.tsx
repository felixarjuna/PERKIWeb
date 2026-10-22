import { redirect } from "next/navigation";
import Template from "~/components/template";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import { getRole } from "~/server/authz";
import AccountActions from "./account-actions";
import ProfileSummary from "./profile-summary";
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

  const canDelete = (await getRole(session.user.id)) !== "owner";

  return (
    <Template
      subtitle="Your details help us care for you as a fellowship."
      title="Your profile"
    >
      <div className="flex w-full flex-col gap-4">
        <ProfileSummary />
        <WhatsappCard />
        <AccountActions canDelete={canDelete} />
      </div>
    </Template>
  );
}
