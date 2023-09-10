import {
  type GetServerSidePropsContext,
  type InferGetServerSidePropsType,
} from "next";
import { getServerSession } from "next-auth";
import { getProviders } from "next-auth/react";
import { authOptions } from "~/server/auth";
import SignInProviders from "./sign-in-providers";

export default function SignInPage({
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-cream-default">
      <div className="w-full max-w-lg rounded-lg bg-green-default/60 p-8">
        <h1 className="font-reimbrandt text-3xl">Sign in to PerkiWEB</h1>
        <div className="mt-8 w-full text-cream-default">
          <SignInProviders providers={providers} />
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
