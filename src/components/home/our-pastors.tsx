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
 * the selected pastor's verse and story sit beside them, so every story
 * is read in place instead of behind a dialog.
 */
export default function OurPastors() {
  const first = pastors.at(0);
  if (!first) {
    return null;
  }

  return (
    <Section eyebrow="Who serves us" id="pastors" title="Our pastors">
      <Tabs
        className="grid gap-8 lg:grid-cols-[14rem_1fr] lg:gap-12"
        defaultValue={slug(first.name)}
        orientation="vertical"
      >
        <TabsList
          aria-label="Pastors"
          className="flex h-auto justify-start gap-2 overflow-x-auto rounded-none bg-transparent p-0 text-foreground lg:flex-col lg:items-stretch lg:overflow-visible"
        >
          {pastors.map((pastor) => (
            <TabsTrigger
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-left font-normal text-sm transition-colors",
                "hover:bg-card data-[state=active]:bg-card data-[state=active]:shadow-none",
                "lg:px-4 lg:py-3"
              )}
              key={pastor.name}
              value={slug(pastor.name)}
            >
              <Image
                alt=""
                className="size-12 shrink-0 rounded-full object-cover object-top lg:size-14"
                height={112}
                sizes="3.5rem"
                src={pastor.img}
                width={112}
              />
              <span className="font-reimbrandt text-base tracking-wide lg:text-lg">
                {pastor.name}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {pastors.map((pastor) => (
          <TabsContent
            className="mt-0 rounded-xl bg-card p-4 sm:p-6"
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
      </Tabs>
    </Section>
  );
}
