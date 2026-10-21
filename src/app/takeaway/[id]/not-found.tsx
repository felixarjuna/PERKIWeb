import Link from "next/link";
import Template from "~/components/template";
import { buttonVariants } from "~/components/ui/button";

/** Shared links outlive takeaways, so a missing one points back to the rest. */
export default function TakeawayNotFound() {
  return (
    <Template
      subtitle="It may have been removed, or the link is incomplete."
      title="Takeaway not found"
    >
      <Link
        className={buttonVariants({ className: "self-center" })}
        href="/takeaway"
      >
        Browse all takeaways
      </Link>
    </Template>
  );
}
