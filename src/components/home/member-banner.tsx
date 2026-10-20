"use client";

import { UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const STORAGE_KEY = "perki:member-banner-dismissed";

/**
 * Non-blocking replacement for the old auto-opening "register as member"
 * dialog. Renders only after mount (so SSR and the first client paint
 * match) and stays hidden once dismissed.
 */
export default function MemberBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private mode or storage disabled: just hide it for this visit.
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <aside
      aria-label="Member registration"
      className="fixed inset-x-4 bottom-4 z-30 flex items-start gap-3 rounded-xl bg-popover p-4 text-popover-foreground shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm sm:text-base">
          Part of the fellowship?
        </p>
        <p className="mt-1 text-muted-foreground text-xs sm:text-sm">
          Register as a member so we can reach you about services and events.
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
