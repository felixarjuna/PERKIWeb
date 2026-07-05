import Link from "next/link";
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
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-foreground">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg sm:p-10">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Perki Aachen
        </p>
        <h1 className="mt-2 font-reimbrandt text-3xl sm:text-4xl">
          Welcome back
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Sign in to continue to PerkiWEB.
        </p>

        <SignInForm />

        <p className="mt-8 text-center text-muted-foreground text-sm">
          New here?{" "}
          <Link
            className="text-foreground underline underline-offset-4"
            href="/auth/signup"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
