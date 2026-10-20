"use client";

import { ListFilter } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import Loader from "~/components/loader";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { type EventTypeEnum, eventTypeEnum } from "~/lib/db/schema/schema";
import { dateTimeFormatter } from "~/lib/utils";
import { api } from "~/trpc/react";
import ActionButton from "../../components/action-button";

export default function TakeawayList({
  management = false,
}: {
  management?: boolean;
}) {
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
                {value === "bible_study" ? "Bible study" : "Church service"}
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

      {takeaways.map((item) => {
        const contributors = item.takeaways.contributors as string[];
        return (
          <TakeawayItem
            bibleVerse={item.schedules.bibleVerse}
            contributors={contributors}
            date={dateTimeFormatter(item.schedules.date.toString())}
            eventType={item.schedules.type}
            key={item.takeaways.id}
            management={management}
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
  readonly management: boolean;
  readonly speaker: string;
  readonly summary: string;
  readonly takeawayId: number;
  readonly title: string;
}

function TakeawayItem(props: TakeawayItemProps) {
  return (
    <article className="w-full rounded-xl bg-card p-4 transition-colors duration-150 hover:bg-accent/40 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="type-subheading min-w-0 flex-1 break-words">
          {props.title}
        </h2>
        <div className="flex shrink-0 items-center gap-x-2">
          {props.management ? (
            <TakeawayActions
              className="hidden items-center gap-x-2 sm:flex"
              takeawayId={props.takeawayId}
            />
          ) : null}
          <span className="type-caption whitespace-nowrap rounded-full bg-paper px-2 py-1 text-paper-foreground">
            {props.eventType === "bible_study"
              ? "bible study"
              : "church service"}
          </span>
        </div>
      </div>
      <div className="type-caption mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
        <p>{props.speaker}</p>
        <span>&middot;</span>
        <p>{props.bibleVerse}</p>
        <span>&middot;</span>
        <p>{props.date}</p>
      </div>
      <p className="type-body mt-4 whitespace-break-spaces">{props.summary}</p>
      <p className="type-caption mt-4 text-muted-foreground">
        {props.contributors.join(" ")}
      </p>

      {props.management ? (
        <TakeawayActions
          className="mt-3 flex w-full place-content-end gap-x-2 sm:hidden"
          takeawayId={props.takeawayId}
        />
      ) : null}
    </article>
  );
}

function TakeawayActions({
  takeawayId,
  className,
}: {
  takeawayId: number;
  className: string;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const deletion = api.takeaways.deleteTakeaway.useMutation({
    onError: () =>
      toast.error("Could not delete the takeaway. Please try again."),
    onSuccess: async () => {
      await utils.takeaways.invalidate();
      toast.success("Takeaway successfully deleted!");
    },
  });
  return (
    <ActionButton
      className={className}
      onDeleteClick={() => deletion.mutate({ id: takeawayId })}
      onEditClick={() => router.push(`/admin/takeaways/${takeawayId}/edit`)}
    />
  );
}
