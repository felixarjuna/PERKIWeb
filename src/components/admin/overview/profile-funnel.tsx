import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface Funnel {
  accounts: number;
  complete: number;
  started: number;
}

const membersWith = (states: string[]) =>
  states.length
    ? `/admin/members?${new URLSearchParams({ profile: states.join(",") })}`
    : "/admin/members";

/** Signed in → started a profile → complete, each step opening that list. */
export default function ProfileFunnel({ funnel }: { funnel: Funnel }) {
  const steps = [
    { href: membersWith([]), label: "signed in", value: funnel.accounts },
    {
      href: membersWith(["incomplete", "complete"]),
      label: "started a profile",
      value: funnel.started,
    },
    {
      href: membersWith(["complete"]),
      label: "complete",
      value: funnel.complete,
    },
  ];
  const unfinished = funnel.accounts - funnel.complete;
  return (
    <section className="flex flex-col gap-3 rounded-xl bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="type-subheading">Profiles</h2>
        {unfinished > 0 ? (
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
            href={membersWith(["incomplete", "not-started"])}
          >
            Follow up with {unfinished} {unfinished === 1 ? "person" : "people"}
          </Link>
        ) : null}
      </div>
      <ol className="grid grid-cols-3 gap-2">
        {steps.map((step, index) => (
          <li className="flex min-w-0 items-center gap-1" key={step.label}>
            <Link
              className="flex min-w-0 flex-1 flex-col rounded-lg bg-secondary/60 p-3 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={step.href}
            >
              <span className="type-figure">{step.value}</span>{" "}
              <span className="type-caption truncate text-muted-foreground">
                {step.label}
              </span>
            </Link>
            {index < steps.length - 1 ? (
              <ChevronRight
                aria-hidden="true"
                className="hidden size-4 shrink-0 text-muted-foreground sm:block"
              />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
