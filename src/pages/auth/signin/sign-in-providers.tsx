import { type InferGetServerSidePropsType } from "next";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { type getServerSideProps } from ".";

export default function SignInProviders({
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  if (typeof providers === "undefined") return;

  return (
    <div className="mt-8 w-full text-cream-default xs:mt-4">
      {Object.values(providers).map((provider) => {
        return (
          <button
            key={provider.id}
            onClick={() =>
              void signIn(provider.id, {
                callbackUrl: `${window.location.origin}`,
              })
            }
            className="flex w-full items-center justify-center gap-x-2 rounded-lg bg-green-default/60 p-2"
          >
            <FcGoogle />
            Sign In with {provider.name}
          </button>
        );
      })}
    </div>
  );
}
