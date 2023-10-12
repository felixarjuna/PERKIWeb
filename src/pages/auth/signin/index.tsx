import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { getProviders } from "next-auth/react";
import { authOptions } from "~/server/auth";
import SignInForm from "./sign-in-form";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-cream-default">
      <div className="w-full max-w-lg rounded-lg bg-green-default/60 p-8 xs:max-w-xs">
        <h1 className="font-reimbrandt text-3xl xs:text-2xl">
          Sign in to PerkiWEB
        </h1>
        <div className="w-full text-cream-default">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    return { redirect: { destination: "/" } };
  }

  const providers = await getProviders();

  return {
    props: { providers: providers ?? [] },
  };
}
