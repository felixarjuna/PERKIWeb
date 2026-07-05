"use client";

import { KeyRound, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export default function AccountActions() {
  return (
    <>
      <Link
        className={cn(buttonVariants({ variant: "default" }), "gap-1")}
        href="/account/change-password"
      >
        <KeyRound className="aspect-square w-4" />
        <p>Change password</p>
      </Link>

      <button
        className="mt-4 flex w-fit cursor-pointer items-center gap-2 place-self-end"
        onClick={() => void signOut({ callbackUrl: "/auth/signin" })}
        type="button"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-light-green-default/50 to-green-default p-[2px]">
          <LogOut className="h-4 w-4" />
        </span>
        <p>Sign out</p>
      </button>
    </>
  );
}
