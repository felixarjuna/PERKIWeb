import Template from "~/components/template";
import { auth } from "~/server/auth";
import PrayerWall from "./prayer-wall";

/** Public prayer wall; signing in lets people share and pray. */
export default async function PrayersPage() {
  const session = await auth();
  return (
    <Template subtitle="Carry one another in prayer." title="Weekly prayer">
      <PrayerWall signedIn={Boolean(session)} />
    </Template>
  );
}
