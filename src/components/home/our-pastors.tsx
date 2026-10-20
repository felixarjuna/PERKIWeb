"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { pastors } from "~/lib/data";
import { cn } from "~/lib/utils";
import Section from "./section";

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const paragraphs = (story: string | React.ReactNode) =>
  typeof story === "string"
    ? story
        .split("\n")
        .map((part) => part.trim())
        .filter(Boolean)
    : [story];

/**
 * Pastor profiles as a tabbed feature: the portraits are the tabs and
 * the selected pastor's verse and story sit beside them, read in place.
 * Every panel stays mounted and stacked in one grid cell, so the block
 * keeps the height of the longest story and the page never jumps when
 * you switch.
 */
export default function OurPastors() {
  const first = pastors.at(0);
  if (!first) {
    return null;
  }

  return (
    <Section eyebrow="Who serves us" id="pastors" title="Our pastors">
      <Tabs
        className="grid gap-6 lg:grid-cols-[15rem_1fr] lg:gap-10"
        defaultValue={slug(first.name)}
        orientation="vertical"
      >
        <TabsList
          aria-label="Pastors"
          className="grid h-auto grid-cols-3 items-start gap-2 rounded-none bg-transparent p-0 text-foreground lg:flex lg:flex-col lg:items-stretch lg:justify-start"
        >
          {pastors.map((pastor) => (
            <TabsTrigger
              className={cn(
                "flex h-full flex-col items-center justify-start gap-2 whitespace-normal rounded-xl px-2 py-3 text-center font-normal text-xs transition-colors",
                "hover:bg-card data-[state=active]:bg-card data-[state=active]:shadow-none",
                "lg:h-auto lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:text-left lg:text-base"
              )}
              key={pastor.name}
              value={slug(pastor.name)}
            >
              <Image
                alt=""
                className="size-14 shrink-0 rounded-full object-cover object-top"
                height={112}
                sizes="3.5rem"
                src={pastor.img}
                width={112}
              />
              <span className="text-balance font-reimbrandt tracking-wide lg:text-lg">
                {pastor.name}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="grid [&>*]:[grid-area:1/1]">
          {pastors.map((pastor) => (
            <TabsContent
              className="mt-0 rounded-xl bg-card p-4 data-[state=inactive]:invisible sm:p-6"
              forceMount
              key={pastor.name}
              value={slug(pastor.name)}
            >
              <div className="flex items-center gap-4 sm:gap-6">
                <Image
                  alt={`Portrait of ${pastor.name}`}
                  className="size-20 shrink-0 rounded-full object-cover object-top sm:size-28"
                  height={224}
                  sizes="7rem"
                  src={pastor.img}
                  width={224}
                />
                <div className="min-w-0">
                  <h3 className="font-reimbrandt text-xl tracking-wide sm:text-2xl">
                    {pastor.name}
                  </h3>
                  <p className="mt-1 text-balance font-reimbrandt text-lg text-muted-foreground tracking-wide sm:text-xl">
                    “{pastor.favoriteVerse}”
                  </p>
                </div>
              </div>

              <div className="mt-6 max-w-prose space-y-4 text-sm sm:text-base">
                {paragraphs(pastor.story).map((part, index) =>
                  typeof part === "string" ? (
                    <p key={part}>{part}</p>
                  ) : (
                    // biome-ignore lint/suspicious/noArrayIndexKey: a single JSX node has no stable key
                    <div key={index}>{part}</div>
                  )
                )}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </Section>
  );
}
