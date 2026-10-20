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
    <main
      className="type-body flex min-h-dvh flex-col items-center justify-center px-4 py-12 text-foreground"
      id="main-content"
    >
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg sm:p-10">
        <p className="type-eyebrow text-muted-foreground">Perki Aachen</p>
        <h1 className="type-title mt-2">Welcome back</h1>
        <p className="type-body-sm mt-1 text-muted-foreground">
          Sign in to your PERKI Aachen account.
        </p>

        <SignInForm />

        <p className="type-body-sm mt-8 text-center text-muted-foreground">
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
