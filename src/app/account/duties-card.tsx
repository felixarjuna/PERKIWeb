import { ClipboardList } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { type Duty, dutyLabel } from "~/lib/duties";
import { cn } from "~/lib/utils";

/** Gatherings happen in Aachen, so dates read in its zone for everyone. */
const ZONE = "Europe/Berlin";

/** The member's next duty, linking to the full list on `/duties`. */
export default function DutiesCard({
  next,
}: {
  next: { date: Date; duties: Duty[]; id: number; title: string } | null;
}) {
  return (
    <section className="flex items-center gap-3 rounded-xl bg-card p-4 sm:p-6">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
        <ClipboardList aria-hidden="true" className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="type-body">Your duties</h2>
        <p className="type-body-sm text-muted-foreground">
          {next
            ? `Next: ${next.duties.map(dutyLabel).join(", ")} on ${DateTime.fromJSDate(next.date).setZone(ZONE).toFormat("ccc d LLL")}`
            : "Nothing coming up for you"}
        </p>
      </div>
      <Link
        aria-label="See your duties"
        className={cn(
          buttonVariants({ size: "sm", variant: "secondary" }),
          "shrink-0"
        )}
        href="/duties"
      >
        See all
      </Link>
    </section>
  );
}
