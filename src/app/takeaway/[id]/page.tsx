import { TRPCError } from "@trpc/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { TakeawayMarkdown } from "~/components/takeaway-markdown";
import Template from "~/components/template";
import { buttonVariants } from "~/components/ui/button";
import { markdownToPlainText } from "~/lib/markdown";
import { api } from "~/trpc/server";
import { readingMinutes } from "../reading-time";
import {
  contributorNames,
  fellowshipLabel,
  publicationDates,
  serviceDate,
} from "../takeaway-format";
import ShareButton from "./share-button";

interface TakeawayPageProps {
  readonly params: Promise<{ id: string }>;
}

const DESCRIPTION_LENGTH = 160;
const WHITESPACE = /\s+/g;

/** Loads the takeaway once per request; unknown or malformed ids are a 404. */
const loadTakeaway = cache(async (rawId: string) => {
  const id = Number(rawId);
  if (!(Number.isSafeInteger(id) && id > 0)) {
    notFound();
  }
  try {
    return await api.takeaways.getTakeawayById({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
});

export async function generateMetadata({
  params,
}: TakeawayPageProps): Promise<Metadata> {
  const { schedules: schedule, takeaways: takeaway } = await loadTakeaway(
    (await params).id
  );
  // Link previews (WhatsApp, social posts) show the TL;DR when there is one.
  const flat = markdownToPlainText(takeaway.tldr ?? takeaway.keypoints)
    .replace(WHITESPACE, " ")
    .trim();
  const description =
    flat.length > DESCRIPTION_LENGTH
      ? `${flat.slice(0, DESCRIPTION_LENGTH - 1).trimEnd()}…`
      : flat;
  return {
    description,
    openGraph: { description, title: schedule.title, type: "article" },
    title: schedule.title,
  };
}

export default async function TakeawayPage({ params }: TakeawayPageProps) {
  const { schedules: schedule, takeaways: takeaway } = await loadTakeaway(
    (await params).id
  );
  const contributors = contributorNames(takeaway.contributors);
  const minutes = readingMinutes(takeaway.keypoints);
  const details: { label: string; value: React.ReactNode }[] = [
    { label: "Passage", value: schedule.bibleVerse },
    { label: "Preached by", value: schedule.preacher },
    { label: "Shared by", value: contributors },
  ].filter((detail): detail is { label: string; value: string } =>
    Boolean(detail.value)
  );
  // When it went public and, after a correction, when it was updated (#74).
  for (const { date, label, text } of publicationDates(
    takeaway.publishedAt,
    takeaway.revisedAt
  )) {
    details.push({
      label,
      value: <time dateTime={date.toISOString()}>{text}</time>,
    });
  }
  // Back to the gathering: its team, duties and any other takeaways.
  details.push({
    label: "Gathering",
    value: (
      <Link
        className="inline-flex items-center gap-1 rounded-sm underline underline-offset-4 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href={`/schedule/${schedule.id}`}
      >
        See the gathering
        <ChevronRight aria-hidden="true" className="size-4" />
      </Link>
    ),
  });

  return (
    <Template
      subtitle={
        // Metadata, not a lead: smaller than the template's subtitle size.
        // Each part stays whole; the line breaks only between parts.
        <p className="type-body-sm">
          <span className="whitespace-nowrap">
            {fellowshipLabel(schedule.type)} ·
          </span>{" "}
          <span className="whitespace-nowrap">
            <time dateTime={schedule.date.toISOString()}>
              {serviceDate(schedule.date, "long")}
            </time>{" "}
            ·
          </span>{" "}
          <span className="whitespace-nowrap">{minutes} min read</span>
        </p>
      }
      title={schedule.title}
      width="wide"
    >
      <dl className="type-body-sm grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-xl bg-card p-4 sm:p-6">
        {details.map((detail) => (
          <div className="contents" key={detail.label}>
            <dt className="text-muted-foreground">{detail.label}</dt>
            <dd className="break-words">{detail.value}</dd>
          </div>
        ))}
      </dl>

      <article className="mt-8">
        <TakeawayMarkdown markdown={takeaway.keypoints} />
      </article>

      {/* Actions wait until the end so nothing sits between the reader and the notes. */}
      <footer className="mt-12 flex items-center justify-between gap-3">
        {/* -ms-4 lines the ghost link's text up with the notes' left edge. */}
        <Link
          className={buttonVariants({ className: "-ms-4", variant: "ghost" })}
          href="/takeaway"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          All takeaways
        </Link>
        <ShareButton title={schedule.title} />
      </footer>
    </Template>
  );
}
