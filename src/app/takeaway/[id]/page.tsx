import { TRPCError } from "@trpc/server";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import Template from "~/components/template";
import { buttonVariants } from "~/components/ui/button";
import { api } from "~/trpc/server";
import {
  contributorNames,
  fellowshipLabel,
  sections,
  serviceDate,
} from "../takeaway-format";

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
  const flat = takeaway.keypoints.replace(WHITESPACE, " ").trim();
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
  const details = [
    { label: "Passage", value: schedule.bibleVerse },
    { label: "Preached by", value: schedule.preacher },
    { label: "Shared by", value: contributors },
  ].filter((detail): detail is { label: string; value: string } =>
    Boolean(detail.value)
  );

  return (
    <Template
      subtitle={
        <p>
          {fellowshipLabel(schedule.type)} ·{" "}
          <time dateTime={schedule.date.toISOString()}>
            {serviceDate(schedule.date, "long")}
          </time>
        </p>
      }
      title={schedule.title}
    >
      <Link
        className={buttonVariants({
          className: "-ms-3 self-start text-muted-foreground",
          size: "sm",
          variant: "ghost",
        })}
        href="/takeaway"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        All takeaways
      </Link>

      <dl className="type-body-sm mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-xl bg-card p-4 sm:p-6">
        {details.map((detail) => (
          <div className="contents" key={detail.label}>
            <dt className="text-muted-foreground">{detail.label}</dt>
            <dd className="break-words">{detail.value}</dd>
          </div>
        ))}
      </dl>

      {/* ~68 characters a line: Satoshi averages ~0.48em, and its wide "0" makes ch-based caps too loose. */}
      <article className="mt-8 max-w-[33rem]">
        {sections(takeaway.keypoints).map((section, index) => (
          <section
            className={section.heading ? "mt-10 first:mt-0" : "mt-5 first:mt-0"}
            // Sections have no id and never reorder.
            key={`${index.toString()}-${section.body.slice(0, 16)}`}
          >
            {section.heading ? (
              <h2 className="type-subheading mb-2 text-balance">
                {section.heading}
              </h2>
            ) : null}
            <p className="type-body whitespace-pre-line text-pretty">
              {section.body}
            </p>
          </section>
        ))}
      </article>
    </Template>
  );
}
