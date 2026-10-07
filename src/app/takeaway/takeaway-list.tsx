"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import Loader from "~/components/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { type EventTypeEnum, eventTypeEnum } from "~/lib/db/schema/schema";
import { dateTimeFormatter } from "~/lib/utils";
import { api } from "~/trpc/react";
import ActionButton from "../../components/action-button";

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

  if (takeaways.length === 0) {
    return <div className="mt-8 text-center">No takeaway found.</div>;
  }

  return (
    <div className="space-y-4">
      <Select onValueChange={(value: EventTypeEnum) => setType(value)}>
        <SelectTrigger>
          <SelectValue placeholder="Fellowship type" />
        </SelectTrigger>
        <SelectContent>
          {eventTypeEnum.enumValues.map((value) => (
            <SelectItem key={value} value={value}>
              {value === "bible_study" ? "Bible study" : "Church service"}
            </SelectItem>
          ))}

          <SelectItem value={"all"}>All</SelectItem>
        </SelectContent>
      </Select>

      {takeaways.map((item) => {
        const contributors = item.takeaways.contributors as string[];
        return (
          <TakeawayItem
            bibleVerse={item.schedules.bibleVerse}
            contributors={contributors}
            date={dateTimeFormatter(item.schedules.date.toString())}
            eventType={item.schedules.type}
            key={item.takeaways.id}
            speaker={item.schedules.leader}
            summary={item.takeaways.keypoints}
            takeawayId={item.takeaways.id}
            title={item.schedules.title}
          />
        );
      })}
    </div>
  );
}

interface TakeawayItemProps {
  readonly bibleVerse: string;
  readonly contributors: string[];
  readonly date: string;
  readonly eventType: EventTypeEnum;
  readonly speaker: string;
  readonly summary: string;
  readonly takeawayId: number;
  readonly title: string;
}

function TakeawayItem(props: TakeawayItemProps) {
  /** hook for toast */
  /** utils to invalidate trpc query. */
  const utils = api.useUtils();

  /** router hook to for edit action. */
  const router = useRouter();

  const deleteTakeaway = api.takeaways.deleteTakeaway.useMutation({
    onSuccess: async () => {
      toast.success("Takeaway successfully deleted!");
      await utils.takeaways.invalidate();
    },
  });

  return (
    <article className="w-full rounded-xl bg-card p-4 transition duration-300 hover:bg-accent/40 sm:p-6">
      <div className="flex items-start justify-between gap-x-3">
        <h2 className="font-reimbrandt text-lg tracking-wide sm:text-xl">
          {props.title}
        </h2>
        <div className="flex shrink-0 items-center gap-x-2">
          <ActionButton
            className="hidden items-center gap-x-2 sm:flex"
            onDeleteClick={() =>
              deleteTakeaway.mutate({ id: +props.takeawayId })
            }
            onEditClick={() =>
              router.push(`/edit-takeaway/${props.takeawayId}`)
            }
          />
          <span className="whitespace-nowrap rounded-full bg-paper px-2 py-1 text-paper-foreground text-xs">
            {props.eventType === "bible_study"
              ? "bible study"
              : "church service"}
          </span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs">
        <p>{props.speaker}</p>
        <span>&middot;</span>
        <p>{props.bibleVerse}</p>
        <span>&middot;</span>
        <p>{props.date}</p>
      </div>
      <p className="mt-4 whitespace-break-spaces text-sm sm:text-base">
        {props.summary}
      </p>
      <p className="mt-4 text-muted-foreground text-xs">
        {props.contributors.join(" ")}
      </p>

      <ActionButton
        className="mt-3 flex w-full place-content-end gap-x-2 sm:hidden"
        onDeleteClick={() => deleteTakeaway.mutate({ id: +props.takeawayId })}
        onEditClick={() => router.push(`/edit-takeaway/${props.takeawayId}`)}
      />
    </article>
  );
}
