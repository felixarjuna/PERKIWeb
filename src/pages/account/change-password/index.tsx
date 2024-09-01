import Navigation from "~/components/home/navigation";
import ChangePasswordForm from "./change-password-form";

export default function ChangePassword() {
  return (
    <section className="mx-auto min-h-screen max-w-5xl pb-40 text-cream-default">
      <Navigation showNav={true} />

      <div className="flex  flex-col items-center px-10 pt-20 xs:px-12 ">
        <div className="flex max-w-5xl flex-col items-center justify-center gap-8 px-14 py-16 xs:w-full xs:px-0 xs:py-8">
          <h1 className="font-reimbrandt text-9xl xs:text-4xl">Account</h1>
          <ChangePasswordForm />
        </div>
      </div>
    </section>
  );
}
