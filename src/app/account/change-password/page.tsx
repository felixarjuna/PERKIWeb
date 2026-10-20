import { redirect } from "next/navigation";
import Template from "~/components/template";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import BackButton from "./back-button";
import ChangePasswordForm from "./change-password-form";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const session = await auth();
  if (!session) {
    redirect(
      authPageUrl(
        "signin",
        requestedPath("/account/change-password", await searchParams)
      )
    );
  }

  return (
    <Template title="Change Password">
      <div className="flex w-full flex-col gap-y-6">
        <BackButton />
        <ChangePasswordForm />
      </div>
    </Template>
  );
}
