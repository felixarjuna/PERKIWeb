"use client";

import { useRouter } from "next/router";
import React from "react";
import Loader from "~/components/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useToast } from "~/components/ui/use-toast";
import { type EventTypeEnum, eventTypeEnum } from "~/lib/db/schema/schema";
import { dateTimeFormatter } from "~/lib/utils";
import { api } from "~/utils/api";
import ActionButton from "../../components/action-button";

export default function TakeawayList() {
  const { data } = api.takeaways.getTakeaways.useQuery();
  const [type, setType] = React.useState<
    "church_service" | "bible_study" | "all"
  >("all");

  const takeaways = React.useMemo(() => {
    return type === "all"
      ? data
      : data?.filter((takeaway) => takeaway.schedules.type === type);
  }, [data, type]);

  if (takeaways === undefined) {
    return <Loader message="Loading takeaways ..." className="mt-8" />;
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
          {Object.entries(eventTypeEnum).map(([key, value]) => (
            <SelectItem value={key} key={key}>
              {value}
            </SelectItem>
          ))}
          <SelectItem value={"all"}>All services</SelectItem>
        </SelectContent>
      </Select>

      {takeaways.map((data, index) => {
        const contributors = data.takeaways.contributors as string[];
        return (
          <TakeawayItem
            key={index}
            takeawayId={data.takeaways.id}
            eventType={data.schedules.type}
            title={data.schedules.title}
            date={dateTimeFormatter(data.schedules.date.toString())}
            speaker={data.schedules.leader}
            bibleVerse={data.schedules.bibleVerse}
            summary={data.takeaways.keypoints}
            contributors={contributors}
          />
        );
      })}
    </div>
  );
}

interface TakeawayItemProps {
  readonly takeawayId: number;
  readonly title: string;
  readonly date: string;
  readonly speaker: string;
  readonly bibleVerse: string;
  readonly summary: string;
  readonly contributors: Array<string>;
  readonly eventType: EventTypeEnum;
}

function TakeawayItem(props: TakeawayItemProps) {
  /** hook for toast */
  const { toast } = useToast();
  /** utils to invalidate trpc query. */
  const utils = api.useContext();

  /** router hook to for edit action. */
  const router = useRouter();

  const deleteTakeaway = api.takeaways.deleteTakeaway.useMutation({
    onSuccess: async () => {
      toast({
        title: "Takeaway successfully deleted! 🥸",
      });
      await utils.takeaways.invalidate();
    },
  });

  return (
    <div className="w-full cursor-pointer rounded-lg bg-green-default/60 p-4 shadow-lg transition duration-300 hover:bg-green-default/80 sm:p-6">
      <h1 className="flex items-center justify-between font-reimbrandt text-lg tracking-wide sm:text-2xl">
        {props.title}
        <div className="flex gap-x-2">
          <ActionButton
            className="hidden items-center gap-x-2 sm:flex"
            onEditClick={() =>
              void router.push(`/edit-takeaway/${props.takeawayId}`)
            }
            onDeleteClick={() =>
              deleteTakeaway.mutate({ id: +props.takeawayId })
            }
          />
          <span className="my-auto flex items-center whitespace-nowrap rounded-lg bg-light-green-default px-2 py-1 text-xs text-green-default sm:text-sm">
            {props.eventType}
          </span>
        </div>
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-1 gap-x-2 font-reimbrandt text-xs text-green-400/80">
        <p>{props.speaker}</p>
        <span>&middot;</span>
        <p>{props.bibleVerse}</p>
        <span>&middot;</span>
        <p>{props.date}</p>
      </div>
      <p className="mt-4 whitespace-break-spaces text-sm">{props.summary}</p>
      <p className="mt-4 text-xs text-green-400/80">
        {props.contributors.join(" ")}
      </p>

      <ActionButton
        className=" visible flex w-full place-content-end gap-x-2 xl:hidden 2xl:hidden"
        onEditClick={() =>
          void router.push(`/edit-takeaway/${props.takeawayId}`)
        }
        onDeleteClick={() => deleteTakeaway.mutate({ id: +props.takeawayId })}
      />
    </div>
  );
}
