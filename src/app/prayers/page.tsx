import Template from "~/components/template";
import { getUsernameFromName } from "~/lib/utils";
import { auth } from "~/server/auth";
import PrayerWall from "./prayer-wall";

export default async function PrayersPage() {
  const session = await auth();
  return (
    <Template subtitle="Carry one another in prayer." title="Weekly prayer">
      <PrayerWall
        username={session ? getUsernameFromName(session.user.name ?? "") : null}
      />
    </Template>
  );
}
