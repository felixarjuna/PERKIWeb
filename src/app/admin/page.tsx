import { LoginForm } from "~/components/login-form";
import Template from "~/components/template";

export default function AdminPage() {
  return (
    <Template
      subtitle="Sign in to manage fellowship members."
      title="Administration"
    >
      <LoginForm />
    </Template>
  );
}
