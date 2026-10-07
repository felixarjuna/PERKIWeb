import Link from "next/link";
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
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-foreground">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg sm:p-10">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Perki Aachen
        </p>
        <h1 className="mt-2 font-reimbrandt text-3xl sm:text-4xl">
          Create your account
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Join the PerkiWEB fellowship platform.
        </p>

        <SignUpForm />

        <p className="mt-8 text-center text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link
            className="text-foreground underline underline-offset-4"
            href="/auth/signin"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
