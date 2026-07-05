"use client";

import { KeyRound, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Template from "~/components/template";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import AccountForm from "./account-form";

export default function Account() {
  return (
    <Template title="Account">
      <div className="mt-8 grid w-full max-w-screen-sm gap-y-4 place-self-center">
        <AccountForm />

        <Link
          className={cn(buttonVariants({ variant: "default" }), "gap-1")}
          href="account/change-password"
        >
          <KeyRound className="aspect-square w-4" />
          <p>Change password</p>
        </Link>

        <div
          className="mt-4 flex xs:flex w-fit cursor-pointer items-center gap-2 xs:gap-l place-self-end"
          onClick={() => void signOut({ callbackUrl: "/auth/signin" })}
        >
          <span className="flex h-8 xs:h-6 w-8 xs:w-6 items-center justify-center rounded-lg bg-gradient-to-r from-light-green-default/50 to-green-default p-[2px] xs:p-[1px] xl:h-8 xl:w-8 2xl:h-8 2xl:w-8">
            <LogOut className="h-4 w-4" />
          </span>
          <p>Sign out</p>
        </div>
      </div>
    </Template>
  );
}
