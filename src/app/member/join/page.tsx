import { Heart } from "lucide-react";
import { redirect } from "next/navigation";
import Template from "~/components/template";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import JoinForm from "./join-form";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const session = await auth();
  // Membership registration links the profile to the signed-in account.
  if (!session) {
    redirect(
      authPageUrl("signin", requestedPath("/member/join", await searchParams))
    );
  }

  const hasProfile = await api.profiles.hasOwnProfile();

  return (
    <Template
      subtitle={
        <span className="inline-flex items-center gap-2">
          Register yourself as PERKI Aachen fellowship member!
          <Heart className="size-4" />
        </span>
      }
      title="Join us"
    >
      <div className="w-full">
        {hasProfile ? (
          <p className="py-10">You are already registered as a member.</p>
        ) : (
          <JoinForm userId={session.user.id} />
        )}
      </div>
    </Template>
  );
}
