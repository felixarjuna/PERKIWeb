import { LoginForm } from "~/components/login-form";

export default function Admin() {
  return (
    <div className="flex h-screen items-center justify-center">
      <LoginForm className="w-11/12 text-light-green-default sm:max-w-lg" />
    </div>
  );
}
