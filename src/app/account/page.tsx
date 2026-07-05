import { redirect } from "next/navigation";
import Template from "~/components/template";
import { auth } from "~/server/auth";
import AccountActions from "./account-actions";
import AccountForm from "./account-form";

export default async function AccountPage() {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <Template title="Account">
      <div className="mt-8 flex w-full max-w-screen-sm flex-col gap-4">
        <AccountForm />
        <AccountActions />
      </div>
    </Template>
  );
}
