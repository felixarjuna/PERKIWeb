import { LoginForm } from "~/components/login-form";
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
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm
        className="w-11/12 text-foreground sm:max-w-lg"
        returnPath={returnPath}
      />
    </div>
  );
}
