import { redirect } from "next/navigation";
import Template from "~/components/template";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { getUsernameFromName } from "~/lib/utils";
import { auth } from "~/server/auth";
import PrayerWall from "./prayer-wall";

export default async function PrayersPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const session = await auth();
  if (!session) {
    redirect(
      authPageUrl("signin", requestedPath("/prayers", await searchParams))
    );
  }

  return (
    <Template
      subtitle={
        <div className="flex flex-col gap-y-1">
          <p>
            “Therefore, I tell you, whatever you ask in prayer, believe that you
            have received it, and it will be yours.”
          </p>
          <p>– Mark 11:24</p>
        </div>
      }
      title="Prayers"
    >
      <PrayerWall username={getUsernameFromName(session.user.name ?? "")} />
    </Template>
  );
}
