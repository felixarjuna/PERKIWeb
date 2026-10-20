import { ChevronDown, Clock3 } from "lucide-react";
import Image from "next/image";
import { events } from "~/lib/data";
import { cn } from "~/lib/utils";
import { buttonVariants } from "../ui/button";
import Section from "./section";

export default function WhatWeDo() {
  return (
    <Section
      eyebrow="Every week"
      id="what-we-do"
      title="What we do"
      tone="paper"
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-12">
        <ul className="divide-y divide-paper-foreground/15">
          {events.map((event) => (
            <li className="py-6 first:pt-0 last:pb-0" key={event.name}>
              <h3 className="text-balance font-reimbrandt text-xl tracking-wide sm:text-2xl">
                {event.name}
              </h3>
              <p className="mt-2 flex items-center gap-2 text-sm">
                <Clock3 aria-hidden="true" className="size-4" />
                <span className="tabular-nums">{event.time}</span>
              </p>
              <p className="mt-3 max-w-prose text-sm sm:text-base">
                {event.notes}
              </p>

              <details className="group mt-4">
                <summary
                  className={cn(
                    buttonVariants({ size: "sm", variant: "outline" }),
                    "cursor-pointer list-none text-foreground [&::-webkit-details-marker]:hidden"
                  )}
                >
                  About this gathering
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="mt-4 max-w-prose space-y-4 text-sm sm:text-base">
                  {event.description}
                </div>
              </details>
            </li>
          ))}
        </ul>

        <figure className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <Image
            alt="A member speaking in front of the group during a Bible study"
            className="aspect-[4/5] w-full rounded-xl object-cover"
            height={1600}
            sizes="(min-width: 1024px) 20rem, 100vw"
            src="/images/learn.jpg"
            width={1280}
          />
          <figcaption className="text-paper-foreground text-xs">
            Big group Bible study around one table.
          </figcaption>
        </figure>
      </div>
    </Section>
  );
}
