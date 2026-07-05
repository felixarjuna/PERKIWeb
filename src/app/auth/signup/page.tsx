import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import SignUpForm from "./sign-up-form";

export default async function SignUpPage() {
  const session = await auth();
  // Already registered and logged in — nothing to do here.
  if (session) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-screen w-10/12 flex-col items-center justify-center text-cream-default">
      <div className="w-full max-w-lg rounded-lg bg-green-default/60 p-8">
        <h1 className="font-reimbrandt text-3xl">Sign up to PerkiWEB</h1>
        <div className="w-full text-cream-default">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
