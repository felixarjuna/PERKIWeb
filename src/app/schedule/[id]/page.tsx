import { TRPCError } from "@trpc/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import Template from "~/components/template";
import { buttonVariants } from "~/components/ui/button";
import { markdownToPlainText } from "~/lib/markdown";
import { api } from "~/trpc/server";
import {
  contributorNames,
  fellowshipLabel,
  serviceDate,
} from "../../takeaway/takeaway-format";
import ScheduleCard from "../schedule-card";

interface GatheringPageProps {
  readonly params: Promise<{ id: string }>;
}

/** Loads the gathering once per request; unknown or malformed ids are a 404. */
const loadGathering = cache(async (rawId: string) => {
  const id = Number(rawId);
  if (!(Number.isSafeInteger(id) && id > 0)) {
    notFound();
  }
  try {
    return await api.schedules.getGathering({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
});

export async function generateMetadata({
  params,
}: GatheringPageProps): Promise<Metadata> {
  const gathering = await loadGathering((await params).id);
  const description = `${fellowshipLabel(gathering.type)} on ${serviceDate(gathering.date, "long")}`;
  return {
    description,
    openGraph: { description, title: gathering.title },
    title: gathering.title,
  };
}

const emptyNotes = (cancelled: boolean, upcoming: boolean) => {
  if (cancelled) {
    return "This gathering was cancelled, so there are no notes from it.";
  }
  return upcoming
    ? "Notes from this gathering appear here once they’re written."
    : "No takeaway has been shared for this gathering yet.";
};

/** One gathering: its team and duties, then the takeaways written for it. */
export default async function GatheringPage({ params }: GatheringPageProps) {
  const gathering = await loadGathering((await params).id);
  // Usually one takeaway, rarely more, so loading each is cheap.
  const notes = await Promise.all(
    gathering.takeawayIds.map((id) => api.takeaways.getTakeawayById({ id }))
  );
  const upcoming = gathering.date.getTime() > Date.now();

  return (
    <Template
      subtitle={
        <p className="type-body-sm">
          <span className="whitespace-nowrap">
            {fellowshipLabel(gathering.type)} ·
          </span>{" "}
          <time
            className="whitespace-nowrap"
            dateTime={gathering.date.toISOString()}
          >
            {serviceDate(gathering.date, "long")}
          </time>
        </p>
      }
      title={gathering.title}
    >
      <ScheduleCard schedule={gathering} standalone />

      <section
        aria-labelledby="takeaways-heading"
        className="mt-4 scroll-mt-28 space-y-4"
        id="takeaways"
      >
        <h2 className="type-heading" id="takeaways-heading">
          Takeaways
        </h2>
        {notes.length === 0 ? (
          <p className="type-body rounded-xl bg-card p-4 text-muted-foreground sm:p-6">
            {emptyNotes(gathering.cancelled, upcoming)}
          </p>
        ) : (
          <ul className="space-y-4">
            {notes.map(({ takeaways: note }) => {
              const contributors = contributorNames(note.contributors);
              return (
                <li key={note.id}>
                  <article className="relative rounded-xl bg-card p-4 transition-colors duration-150 hover:bg-accent/40 sm:p-6">
                    <p className="type-body line-clamp-3 whitespace-pre-line text-pretty">
                      {markdownToPlainText(note.keypoints)}
                    </p>
                    <div className="type-body-sm mt-4 flex items-center justify-between gap-3 text-muted-foreground">
                      <p className="min-w-0">
                        {contributors ? `Shared by ${contributors}` : null}
                      </p>
                      <Link
                        className="flex shrink-0 items-center gap-1 text-foreground after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
                        href={`/takeaway/${note.id}`}
                      >
                        Read takeaway
                        <ChevronRight aria-hidden="true" className="size-4" />
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="mt-12">
        {/* -ms-4 lines the ghost link's text up with the content's left edge. */}
        <Link
          className={buttonVariants({ className: "-ms-4", variant: "ghost" })}
          href="/schedule"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Full schedule
        </Link>
      </footer>
    </Template>
  );
}
