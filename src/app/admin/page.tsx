import { LoginForm } from "~/components/login-form";
import Template from "~/components/template";
import { getReturnPath, type PageSearchParams } from "~/lib/auth-redirect";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const query = await searchParams;
  const callback = getReturnPath(
    typeof query.callbackUrl === "string" ? query.callbackUrl : null
  );
  const returnPath = callback.startsWith("/admin/")
    ? callback
    : "/admin/dashboard";
  return (
    <Template
      subtitle="Sign in to manage fellowship content and members."
      title="Administration"
    >
      <LoginForm returnPath={returnPath} />
    </Template>
  );
}
