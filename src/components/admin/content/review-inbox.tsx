"use client";

import { DateTime } from "luxon";
import Link from "next/link";
import { api, type RouterOutputs } from "~/trpc/react";
import { TakeawayStatusBadges } from "./takeaway-status-badges";
import { assignmentQueryOptions } from "./writer-assignments";

export type InboxData = RouterOutputs["reviewInbox"]["mine"];
type Item = InboxData["needsReview"][number];

const SECTIONS = [
  { key: "readyToPublish", label: "Ready to publish", showWriter: true },
  { key: "openFeedback", label: "Open feedback", showWriter: false },
  { key: "needsReview", label: "Needs review", showWriter: true },
] as const;

const count = (value: number, noun: string) =>
  `${value} open ${noun}${value === 1 ? "" : "s"}`;

const feedbackSummary = (item: Item) => {
  const parts = [
    item.openComments ? count(item.openComments, "comment") : null,
    item.openSuggestions ? count(item.openSuggestions, "suggestion") : null,
  ].filter((part) => part !== null);
  return parts.length ? parts.join(" · ") : "No open feedback";
};

function InboxCard({ item, showWriter }: { item: Item; showWriter: boolean }) {
  const summary = feedbackSummary(item);
  return (
    <li className="relative rounded-xl bg-card p-5 hover:bg-accent/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="type-caption min-w-0 text-muted-foreground">
          {item.type === "church_service" ? "Church service" : "Bible study"} ·{" "}
          {DateTime.fromJSDate(item.date, { zone: "Europe/Berlin" }).toFormat(
            "d LLL yyyy"
          )}
        </p>
        <TakeawayStatusBadges revision={item.revision} status={item.status} />
      </div>
      <h3 className="type-subheading mt-2 break-words">
        <Link
          aria-label={
            // A correction (#74) is read and reviewed on the same page.
            item.revision
              ? `Review changes to ${item.title}`
              : `Review ${item.title}`
          }
          className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background"
          href={`/admin/takeaways/${item.id}`}
        >
          {item.title}
        </Link>
      </h3>
      <p className="type-body-sm mt-1 text-muted-foreground">
        {showWriter ? `By ${item.authorName ?? "an unknown writer"} · ` : ""}
        {summary}
      </p>
    </li>
  );
}

/** The inbox lists; nothing at all when nothing waits for the viewer. */
export function InboxSections({ data }: { data: InboxData }) {
  const sections = SECTIONS.filter((section) => data[section.key].length);
  if (!sections.length) {
    return null;
  }
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section aria-label={section.label} key={section.key}>
          <h2 className="type-heading mb-3">
            {section.label}{" "}
            <span className="type-caption text-muted-foreground">
              ({data[section.key].length})
            </span>
          </h2>
          <ul className="grid gap-3">
            {data[section.key].map((item) => (
              <InboxCard
                item={item}
                key={item.id}
                showWriter={section.showWriter}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** What waits for the viewer in review (#59), above their assignments. */
export function ReviewInbox() {
  const { data } = api.reviewInbox.mine.useQuery(
    undefined,
    assignmentQueryOptions
  );
  return data ? <InboxSections data={data} /> : null;
}
