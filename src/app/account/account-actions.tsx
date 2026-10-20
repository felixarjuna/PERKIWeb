"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";

export default function AccountActions() {
  return (
    <Button
      className="mt-4 w-fit gap-2 place-self-end"
      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      type="button"
      variant="ghost"
    >
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}
