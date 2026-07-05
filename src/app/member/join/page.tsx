import { redirect } from "next/navigation";
import Template from "~/components/template";
import { auth } from "~/server/auth";
import JoinForm from "./join-form";

export default async function JoinPage() {
  const session = await auth();
  // Membership registration links the profile to the signed-in account.
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <Template
      subtitle="Register yourself as PERKI Aachen fellowship member! ❤️"
      title="Join us"
    >
      <div className="mx-auto mt-4 grid w-full max-w-5xl gap-4 px-0 sm:px-14">
        <JoinForm />
      </div>
    </Template>
  );
}
