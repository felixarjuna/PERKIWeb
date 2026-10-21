import { redirect } from "next/navigation";
import Template from "~/components/template";
import {
  authPageUrl,
  getReturnPath,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import WelcomeForm from "./welcome-form";
import { welcomeTitle } from "./welcome-name";

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session) {
    redirect(authPageUrl("signin", requestedPath("/welcome", params)));
  }
  const callback = params.callbackUrl;
  const returnPath = getReturnPath(
    Array.isArray(callback) ? callback[0] : callback
  );
  // Shown once: anyone who has a profile or already saw it moves straight on.
  const { welcomeDue } = await api.profiles.mine();
  if (!welcomeDue) {
    redirect(returnPath);
  }

  return (
    <Template
      subtitle="A few details so we can care for you as a fellowship. Takes about a minute, and you can change them any time."
      title={welcomeTitle(session.user.name)}
    >
      <WelcomeForm returnPath={returnPath} />
    </Template>
  );
}
