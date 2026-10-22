import Link from "next/link";
import { auth } from "~/server/auth";
import { getRole } from "~/server/authz";

/** Points signed-in members to the "Your role" row on /account. */
export default async function WriterHint() {
  const session = await auth();
  if (!session || (await getRole(session.user.id)) !== "member") {
    return null;
  }
  return (
    <p className="type-body-sm mb-6 text-center text-muted-foreground">
      Want to write takeaways?{" "}
      <Link
        className="text-foreground underline underline-offset-4 hover:no-underline"
        href="/account#your-role"
      >
        Ask to become a writer
      </Link>
    </p>
  );
}
