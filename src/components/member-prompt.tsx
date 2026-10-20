"use client";

import { UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

const STORAGE_KEY = "perki:member-prompt-dismissed";

/**
 * Nudges signed-in users who have not registered as a fellowship member
 * yet. Lives on the app pages (not the landing page, which is for
 * newcomers). Hidden once dismissed on this device.
 */
export default function MemberPrompt() {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(true);
  const { data: hasProfile } = api.profiles.hasOwnProfile.useQuery(undefined, {
    enabled: Boolean(session),
  });

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Storage unavailable: hide it for this visit only.
    }
  };

  if (dismissed || !session || hasProfile !== false) {
    return null;
  }

  return (
    <aside
      aria-label="Member registration"
      className="fixed inset-x-4 bottom-4 z-30 flex items-start gap-3 rounded-xl bg-popover p-4 text-popover-foreground shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm sm:text-base">
          You are not registered as a member yet
        </p>
        <p className="mt-1 text-muted-foreground text-xs sm:text-sm">
          Fill in the member form once so the fellowship can reach you about
          services and events.
        </p>
        <Link
          className={cn(buttonVariants({ size: "sm" }), "mt-3")}
          href="/member/join"
          onClick={dismiss}
        >
          <UserPlus aria-hidden="true" className="size-4" />
          Register as a member
        </Link>
      </div>
      <Button
        aria-label="Dismiss"
        className="-mt-1 -mr-1 size-9 shrink-0"
        onClick={dismiss}
        size="icon"
        type="button"
        variant="ghost"
      >
        <X aria-hidden="true" className="size-4" />
      </Button>
    </aside>
  );
}
