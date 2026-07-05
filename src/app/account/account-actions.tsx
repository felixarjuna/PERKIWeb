"use client";

import { KeyRound, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

export default function AccountActions() {
  const { data: user } = api.users.getUserById.useQuery();

  return (
    <>
      {user?.hasPassword ? (
        <Link
          className={cn(buttonVariants({ variant: "secondary" }), "gap-1")}
          href="/account/change-password"
        >
          <KeyRound className="size-4" />
          Change password
        </Link>
      ) : null}

      <Button
        className="mt-4 w-fit gap-2 place-self-end"
        onClick={() => void signOut({ callbackUrl: "/auth/signin" })}
        type="button"
        variant="ghost"
      >
        <LogOut className="size-4" />
        Sign out
      </Button>
    </>
  );
}
