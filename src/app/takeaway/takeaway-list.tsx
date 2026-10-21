"use client";

import { ChevronRight, ListFilter } from "lucide-react";
import Link from "next/link";
import React from "react";
import Loader from "~/components/loader";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { eventTypeEnum } from "~/lib/db/schema/schema";
import { api, type RouterOutputs } from "~/trpc/react";
import {
  contributorNames,
  fellowshipLabel,
  preview,
  serviceDate,
} from "./takeaway-format";

type Takeaway = RouterOutputs["takeaways"]["getTakeaways"][number];

export default function TakeawayList() {
  const { data } = api.takeaways.getTakeaways.useQuery();
  const [type, setType] = React.useState<
    "church_service" | "bible_study" | "all"
  >("all");

  const takeaways = React.useMemo(
    () =>
      type === "all"
        ? data
        : data?.filter((takeaway) => takeaway.schedules.type === type),
    [data, type]
  );

  if (takeaways === undefined) {
    return <Loader className="mt-8" message="Loading takeaways ..." />;
  }

  return (
    <div className="space-y-4">
      <Select
        onValueChange={(value) => {
          if (
            value === "all" ||
            value === "church_service" ||
            value === "bible_study"
          ) {
            setType(value);
          }
        }}
        value={type}
      >
        <SelectTrigger
          aria-label="Fellowship type"
          className="sm:w-56"
          variant="filter"
        >
          <span className="flex min-w-0 items-center gap-2">
            <ListFilter aria-hidden="true" className="size-3.5 shrink-0" />
            <SelectValue className="truncate" />
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All fellowships</SelectItem>
            {eventTypeEnum.enumValues.map((value) => (
              <SelectItem key={value} value={value}>
                {fellowshipLabel(value)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {takeaways.length === 0 ? (
        <p className="type-body rounded-xl bg-card p-6 text-muted-foreground">
          No takeaways for this fellowship type yet. Choose another type or add
          a takeaway.
        </p>
      ) : null}

      {takeaways.length > 0 ? (
        <ul className="space-y-4">
          {takeaways.map((item) => (
            <li key={item.takeaways.id}>
              <TakeawayCard item={item} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function TakeawayCard({ item }: { item: Takeaway }) {
  const { schedules: schedule, takeaways: takeaway } = item;
  const contributors = contributorNames(takeaway.contributors);
  return (
    <article className="relative rounded-xl bg-card p-4 transition-colors duration-150 hover:bg-accent/40 sm:p-6">
      <p className="type-eyebrow text-muted-foreground">
        {fellowshipLabel(schedule.type)} · {serviceDate(schedule.date)}
      </p>
      <h2 className="type-subheading mt-2 break-words">
        <Link
          className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
          href={`/takeaway/${takeaway.id}`}
        >
          {schedule.title}
        </Link>
      </h2>
      <p className="type-body-sm mt-1 text-muted-foreground">
        {[schedule.bibleVerse, schedule.preacher].filter(Boolean).join(" · ")}
      </p>
      <p className="type-body mt-3 line-clamp-3 whitespace-pre-line text-pretty">
        {preview(takeaway.keypoints)}
      </p>
      <div className="type-body-sm mt-4 flex items-center justify-between gap-3 text-muted-foreground">
        <p className="min-w-0">
          {contributors ? `Shared by ${contributors}` : null}
        </p>
        <span
          aria-hidden="true"
          className="flex shrink-0 items-center gap-1 text-foreground"
        >
          Read
          <ChevronRight className="size-4" />
        </span>
      </div>
    </article>
  );
}
