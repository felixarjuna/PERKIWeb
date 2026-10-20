import { redirect } from "next/navigation";
import Template from "~/components/template";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import AccountActions from "./account-actions";
import AccountForm from "./account-form";

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

  return (
    <Template title="Account">
      <div className="flex w-full flex-col gap-4">
        <AccountForm />
        <AccountActions />
      </div>
    </Template>
  );
}
