import Link from "next/link";
import Template from "~/components/template";
import { buttonVariants } from "~/components/ui/button";

/** Shared links outlive gatherings, so a missing one points back to the rest. */
export default function GatheringNotFound() {
  return (
    <Template
      subtitle="It may have been removed, or the link is incomplete."
      title="Gathering not found"
    >
      <Link
        className={buttonVariants({ className: "self-center" })}
        href="/schedule"
      >
        See the schedule
      </Link>
    </Template>
  );
}
