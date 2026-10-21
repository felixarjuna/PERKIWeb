import { ChevronLeft } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import Template from "~/components/template";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { buttonVariants } from "~/components/ui/button";
import { api } from "~/trpc/server";

export default async function Group() {
  const term = await api.groups.getCurrent();
  const since = term
    ? DateTime.fromISO(term.startsOn).toFormat("LLLL yyyy")
    : null;
  return (
    <Template
      subtitle={
        since
          ? `Cleaning and cooking groups since ${since}`
          : "Cleaning and cooking groups"
      }
      title="Groups"
    >
      <div className="w-full">
        {term && term.groups.length > 0 ? (
          <Accordion className="grid gap-2" collapsible type="single">
            {term.groups.map((group) => (
              <AccordionItem
                className="rounded-xl bg-card px-4 transition-colors duration-150 hover:bg-accent/40"
                key={group.name}
                value={group.name}
              >
                <AccordionTrigger>{group.name}</AccordionTrigger>
                <AccordionContent className="flex flex-wrap gap-2">
                  {group.members.map((member) => (
                    <div
                      className="type-caption w-fit rounded-full bg-paper px-3 py-1 text-paper-foreground"
                      key={member}
                    >
                      {member}
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="type-body text-center text-muted-foreground">
            The groups for this term haven't been set yet.
          </p>
        )}
      </div>

      {/* The groups page is opened from a schedule's cooking or cleaning drawer. */}
      <footer className="mt-12">
        {/* -ms-4 lines the ghost link's text up with the groups' left edge. */}
        <Link
          className={buttonVariants({ className: "-ms-4", variant: "ghost" })}
          href="/schedule"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Schedule
        </Link>
      </footer>
    </Template>
  );
}
