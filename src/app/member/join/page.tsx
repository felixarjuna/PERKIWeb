import { redirect } from "next/navigation";

/** The member form now lives on the profile page; old links land there. */
export default function JoinPage() {
  redirect("/account");
}
