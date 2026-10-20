import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { env } from "~/env.mjs";
import {
  authPageUrl,
  getReturnPath,
  getSameOriginReturnPath,
  type PageSearchParams,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import SignInForm from "./sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const query = await searchParams;
  const cookieStore = await cookies();
  const savedCallback =
    cookieStore.get("__Secure-authjs.callback-url")?.value ??
    cookieStore.get("authjs.callback-url")?.value;
  let callbackUrl = getReturnPath(
    typeof query.callbackUrl === "string" ? query.callbackUrl : null
  );
  if (
    typeof query.callbackUrl !== "string" &&
    typeof query.error === "string"
  ) {
    callbackUrl = getSameOriginReturnPath(savedCallback, env.NEXTAUTH_URL);
  }
  const session = await auth();
  // Signed-in users continue to their intended destination.
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
        <h1 className="type-title mt-2">Welcome back</h1>
        <p className="type-body-sm mt-1 text-muted-foreground">
          Sign in to your PERKI Aachen account.
        </p>

        <SignInForm returnPath={callbackUrl} />

        <p className="type-body-sm mt-8 text-center text-muted-foreground">
          New here?{" "}
          <Link
            className="text-foreground underline underline-offset-4"
            href={authPageUrl("signup", callbackUrl)}
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
