import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Navigation from "~/components/navigation";
import AccountForm from "./account-form";

export default function Account() {
  return (
    <section className="mx-auto min-h-screen max-w-5xl pb-40 text-cream-default">
      <Navigation showNav={true} />

      <div className="flex flex-col items-center px-10 pt-20 xs:px-12">
        <div className="flex max-w-5xl flex-col items-center justify-center gap-8 px-14 py-16 xs:w-full xs:max-w-sm xs:px-0 xs:py-8">
          <h1 className="font-reimbrandt text-9xl xs:text-4xl">Account</h1>
          <AccountForm />
        </div>

        <div
          className="xs:gap-l flex w-fit cursor-pointer items-center gap-2 place-self-end xs:flex"
          onClick={() => void signOut({ callbackUrl: "/auth/signin" })}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-light-green-default/50 to-green-default p-[2px] xl:h-8 xl:w-8 2xl:h-8 2xl:w-8 xs:h-6 xs:w-6 xs:p-[1px]">
            <LogOut className="h-4 w-4" />
          </span>
          Sign out
        </div>
      </div>
    </section>
  );
}
