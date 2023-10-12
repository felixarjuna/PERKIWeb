import SignUpForm from "./sign-up-form";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-cream-default">
      <div className="w-full max-w-lg rounded-lg bg-green-default/60 p-8 xs:max-w-xs">
        <h1 className="font-reimbrandt text-3xl xs:text-2xl">
          Sign in to PerkiWEB
        </h1>
        <div className="w-full text-cream-default">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
