import { redirect } from "next/navigation";

/** Passwords are managed by Google; keep old bookmarks navigable. */
export default function ChangePasswordPage() {
  redirect("/account");
}
