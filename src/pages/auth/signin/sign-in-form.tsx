"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "~/components/ui/use-toast";
import { useAsPath } from "~/utils/hooks/usePathStore";

export default function SignInForm() {
  const { data: session } = useSession();

  const router = useRouter();
  if (session) router.back();

  /** redirect to the previous visited path. */
  const prevRoute = useAsPath();
  const { toast } = useToast();

  /** google oauth login action. */
  async function onGoogleLogin() {
    try {
      await signIn("google", {
        callbackUrl: prevRoute.prevAsPath,
      });
      toast({
        title: "Authentication succesfull!",
        description: "You are now logged in! ❤️",
      });
    } catch (error) {
      toast({
        title: "Authentication failed!",
      });
    }
  }

  return (
    <div>
      <div className="mt-6">
        <button
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={async () => await onGoogleLogin()}
          className="flex w-full items-center justify-center gap-x-2 rounded-lg bg-green-default/60 p-2"
        >
          <FcGoogle />
          Continue with Google
        </button>
      </div>
    </div>
  );
}
