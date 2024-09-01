"use client";

import { KeyRound, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import Template from "~/components/template";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import AccountForm from "./account-form";

export default function Account() {
  return (
    <Template title="Account">
      <div className="grid w-full gap-y-4">
        <AccountForm />

        <Link
          href="account/change-password"
          className={cn(buttonVariants({ variant: "default" }), "gap-1")}
        >
          <KeyRound className="aspect-square w-4" />
          <p>Change password</p>
        </Link>

        <div
          className="xs:gap-l flex w-fit cursor-pointer items-center gap-2 place-self-end xs:flex"
          onClick={() => void signOut({ callbackUrl: "/auth/signin" })}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-light-green-default/50 to-green-default p-[2px] xl:h-8 xl:w-8 2xl:h-8 2xl:w-8 xs:h-6 xs:w-6 xs:p-[1px]">
            <LogOut className="h-4 w-4" />
          </span>
          <p>Sign out</p>
        </div>
      </div>
    </Template>
  );
}
