"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { welcomePath } from "~/lib/auth-redirect";
import { api } from "~/trpc/react";

/** Pages that never send anyone to the welcome step. */
const EXEMPT = /^\/(welcome|admin|auth)(\/|$)/;

/**
 * Sends a signed-in person without a profile to the welcome step once, on
 * their next visit to an app page, then back to that page.
 */
export default function WelcomeGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const exempt = pathname === "/" || EXEMPT.test(pathname);
  const { data } = api.profiles.mine.useQuery(undefined, {
    enabled: Boolean(session) && !exempt,
  });
  const due = Boolean(session) && !exempt && data?.welcomeDue === true;

  useEffect(() => {
    if (due) {
      router.replace(
        welcomePath(`${window.location.pathname}${window.location.search}`)
      );
    }
  }, [due, router]);

  return null;
}
