import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import SignInForm from "./sign-in-form";

export default async function SignInPage() {
  const session = await auth();
  // If the user is already logged in, redirect home.
  if (session) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-screen w-10/12 flex-col items-center justify-center text-cream-default">
      <div className="w-full max-w-lg rounded-lg bg-green-default/60 p-8">
        <h1 className="font-reimbrandt text-3xl">Sign in to PerkiWEB</h1>
        <div className="w-full text-cream-default">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
