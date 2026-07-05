import type { InferGetServerSidePropsType } from "next";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import type { getServerSideProps } from ".";

export default function SignInProviders({
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  if (typeof providers === "undefined") return;

  return (
    <div className="mt-8 xs:mt-4 w-full text-cream-default">
      {Object.values(providers).map((provider) => (
        <button
          className="flex w-full items-center justify-center gap-x-2 rounded-lg bg-green-default/60 p-2"
          key={provider.id}
          onClick={() =>
            void signIn(provider.id, {
              callbackUrl: `${window.location.origin}`,
            })
          }
        >
          <FcGoogle />
          Sign In with {provider.name}
        </button>
      ))}
    </div>
  );
}
