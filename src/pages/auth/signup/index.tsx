import SignUpForm from "./sign-up-form";

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-screen w-10/12 flex-col items-center justify-center text-cream-default">
      <div className="w-full max-w-lg xs:max-w-xs rounded-lg bg-green-default/60 p-8">
        <h1 className="font-reimbrandt text-3xl xs:text-2xl">
          Sign up to PerkiWEB
        </h1>
        <div className="w-full text-cream-default">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
