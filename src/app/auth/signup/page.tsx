import Link from "next/link";
import { redirect } from "next/navigation";
import {
  authPageUrl,
  getReturnPath,
  type PageSearchParams,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import SignUpForm from "./sign-up-form";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const query = await searchParams;
  const callbackUrl = getReturnPath(
    typeof query.callbackUrl === "string" ? query.callbackUrl : null
  );
  const session = await auth();
  // Already registered and logged in — nothing to do here.
  if (session) {
    redirect(callbackUrl);
  }

  return (
    <main
      className="type-body flex min-h-dvh flex-col items-center justify-center px-4 py-12 text-foreground"
      id="main-content"
    >
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg sm:p-10">
        <p className="type-eyebrow text-muted-foreground">Perki Aachen</p>
        <h1 className="type-title mt-2">Create your account</h1>
        <p className="type-body-sm mt-1 text-muted-foreground">
          Create an account to see schedules, takeaways and the prayer wall.
          Part of the fellowship? You can register as a member right after.
        </p>

        <SignUpForm callbackUrl={callbackUrl} />

        <p className="type-body-sm mt-8 text-center text-muted-foreground">
          Already have an account?{" "}
          <Link
            className="text-foreground underline underline-offset-4"
            href={authPageUrl("signin", callbackUrl)}
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
