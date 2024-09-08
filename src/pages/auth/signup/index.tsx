import SignUpForm from "./sign-up-form";

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-screen w-10/12 flex-col items-center justify-center text-cream-default">
      <div className="xs:max-w-xs w-full max-w-lg rounded-lg bg-green-default/60 p-8">
        <h1 className="xs:text-2xl font-reimbrandt text-3xl">
          Sign up to PerkiWEB
        </h1>
        <div className="w-full text-cream-default">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
