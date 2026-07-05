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
      <div className="mt-8 flex flex-col gap-y-8">
        <BackButton />
        <ChangePasswordForm />
      </div>
    </Template>
  );
}
