import { redirect } from "next/navigation";
import Template from "~/components/template";
import { auth } from "~/server/auth";
import BackButton from "./back-button";
import ChangePasswordForm from "./change-password-form";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
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
