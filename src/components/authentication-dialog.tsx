import {
  type GetServerSidePropsContext,
  type InferGetServerSidePropsType,
} from "next";
import { getServerSession } from "next-auth";
import { getProviders } from "next-auth/react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { authOptions } from "~/server/auth";
import { Dialog, DialogContent } from "./ui/dialog";

interface AuthenticationDialogProps
  extends InferGetServerSidePropsType<typeof getServerSideProps> {
  isOpen?: boolean;
}

export default function AuthenticationDialog({
  providers,
  isOpen,
}: AuthenticationDialogProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="xl:space-y-4 2xl:space-y-2">
        <h1 className="font-reimbrandt text-xl font-bold">
          To view the content, please create an account or login first
        </h1>

        <div className="flex max-w-md items-center justify-center gap-x-2 rounded-lg bg-green-default/60 p-2">
          <FcGoogle />
          <p>Login with Google</p>
        </div>

        <div className="text-center">
          Already have an account?{" "}
          <Link href="auth/sign-in" className="underline underline-offset-2">
            Log in
          </Link>{" "}
        </div>
      </DialogContent>
    </Dialog>
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
