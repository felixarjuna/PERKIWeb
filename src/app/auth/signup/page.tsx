import { redirect } from "next/navigation";
import {
  authPageUrl,
  getReturnPath,
  type PageSearchParams,
} from "~/lib/auth-redirect";

/** Preserve old signup links now that Google handles account creation. */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const query = await searchParams;
  const returnPath = getReturnPath(
    typeof query.callbackUrl === "string" ? query.callbackUrl : null
  );
  redirect(authPageUrl("signin", returnPath));
}
