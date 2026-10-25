import { redirect } from "next/navigation";
import Template from "~/components/template";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import DutiesView from "./duties-view";
import OpenSlots from "./open-slots";
import UnavailableDates from "./unavailable-dates";

export default async function DutiesPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const session = await auth();
  if (!session) {
    redirect(
      authPageUrl("signin", requestedPath("/duties", await searchParams))
    );
  }
  const [{ past, upcoming }, open, away] = await Promise.all([
    api.schedules.myDuties(),
    api.schedules.openSlots(),
    api.unavailability.mine(),
  ]);
  // Marking days matters to people who serve: in the pool or on the schedule.
  const serves = away.inPool || upcoming.length > 0 || away.ranges.length > 0;
  return (
    <Template
      subtitle="When you serve, and when your group cooks or cleans."
      title="Your duties"
    >
      <div className="space-y-8">
        <OpenSlots active={open.active} slots={open.slots} />
        {serves ? <UnavailableDates ranges={away.ranges} /> : null}
        <DutiesView now={new Date()} past={past} upcoming={upcoming} />
      </div>
    </Template>
  );
}
