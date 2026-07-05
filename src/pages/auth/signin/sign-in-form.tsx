"use client";

import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { useAsPath } from "~/utils/hooks/usePathStore";
import { toast } from "sonner";

export default function SignInForm() {
  const { data: session } = useSession();

  const router = useRouter();
  if (session) router.back();

  /** redirect to the previous visited path. */
  const prevRoute = useAsPath();

  /** google oauth login action. */
  async function onGoogleLogin() {
    try {
      await signIn("google", {
        callbackUrl: prevRoute.prevAsPath,
      });
      toast.success("Authentication succesfull!", { description: "You are now logged in! ❤️" });
    } catch {
      toast.success("Authentication failed!");
    }
  }

  return (
    <div>
      <div className="mt-6">
        <button
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          className="flex w-full items-center justify-center gap-x-2 rounded-lg bg-green-default/60 p-2"
          onClick={async () => await onGoogleLogin()}
        >
          <FcGoogle />
          Continue with Google
        </button>
      </div>
    </div>
  );
}
