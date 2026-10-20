import { Clock3 } from "lucide-react";
import Image from "next/image";
import { events } from "~/lib/data";
import { buttonVariants } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
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

              <Dialog>
                <DialogTrigger
                  className={buttonVariants({
                    className: "mt-4 text-foreground",
                    size: "sm",
                    variant: "outline",
                  })}
                >
                  About this gathering
                </DialogTrigger>
                <DialogContent className="max-h-[85dvh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-reimbrandt text-xl tracking-wide">
                      {event.name}
                    </DialogTitle>
                    <DialogDescription className="text-left text-muted-foreground text-sm sm:text-base">
                      {event.time}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm sm:text-base">
                    {event.description}
                  </div>
                </DialogContent>
              </Dialog>
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
          <figcaption className="text-paper-foreground/70 text-xs">
            Big group Bible study around one table.
          </figcaption>
        </figure>
      </div>
    </Section>
  );
}
