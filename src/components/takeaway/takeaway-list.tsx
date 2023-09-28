"use client";

// import { trpc } from "@/app/_trpc/client";

import { isEmpty } from "lodash";
import { useRouter } from "next/router";
import React from "react";
import { useToast } from "~/components/ui/use-toast";
import { dateTimeFormatter } from "~/lib/utils";
import { api } from "~/utils/api";
import ActionButton from "../action-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface TakeawayListProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: { id: string; label: string }[];
}

export default function TakeawayList({ tabs }: TakeawayListProps) {
  const { data } = api.takeaways.getTakeaways.useQuery();
  const [takeawayId, setTakeawayId] = React.useState<string>("");

  const takeaways = React.useMemo(() => {
    return isEmpty(takeawayId) || takeawayId === "all"
      ? data
      : data?.filter((takeaway) => takeaway.takeawayId === takeawayId);
  }, [data, takeawayId]);

  return (
    <div className="space-y-4">
      <Select onValueChange={(value) => setTakeawayId(value)}>
        <SelectTrigger>
          <SelectValue placeholder="Fellowship type" />
        </SelectTrigger>
        <SelectContent>
          {tabs.map((tab) => (
            <SelectItem value={tab.id} key={tab.id}>
              {tab.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="space-y-4">
        {takeaways?.map((takeaway, index) => {
          return (
            <TakeawayItem
              key={index}
              tabId={takeaway.takeawayId}
              id={takeaway.id}
              title={takeaway.title}
              date={dateTimeFormatter(takeaway.date.toString())}
              speaker={takeaway.speaker}
              bibleVerse={takeaway.bibleVerse}
              summary={takeaway.summary}
              contributors={takeaway.contributors}
            />
          );
        })}
      </div>
    </div>
  );
}

interface TakeawayItemProps {
  id: number;
  tabId: string;
  title: string;
  date: string;
  speaker: string;
  bibleVerse: string;
  summary: string;
  contributors: Array<string>;
}

function TakeawayItem(props: TakeawayItemProps) {
  const { toast } = useToast();
  const utils = api.useContext();

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
    <div className="w-full cursor-pointer rounded-lg bg-green-default/60 p-6 shadow-lg transition duration-300 hover:bg-green-default/80 xs:p-4">
      <h1 className="flex items-center justify-between font-reimbrandt text-2xl tracking-wide xs:text-lg">
        {props.title}
        <div className="flex gap-x-2">
          <ActionButton
            className="flex items-center gap-x-2 xs:hidden"
            onEditClick={() => void router.push(`/edit-takeaway/${props.id}`)}
            onDeleteClick={() => deleteTakeaway.mutate({ id: props.id })}
          />
          <span className="my-auto flex h-6 items-center rounded-lg bg-light-green-default px-2 text-sm text-green-default xs:p-1 xs:text-xs">
            {props.tabId}
          </span>
        </div>
      </h1>
      <div className="flex items-center gap-x-2 font-reimbrandt text-green-400/80 xs:mt-2 xs:flex-wrap xs:gap-1 xs:text-xs">
        <p>{props.speaker}</p>
        <span>&middot;</span>
        <p>{props.bibleVerse}</p>
        <span>&middot;</span>
        <p>{props.date}</p>
      </div>
      <p className="mt-4 xs:text-sm">{props.summary}</p>
      <p className="mt-4 text-green-400/80 xs:text-xs">
        {props.contributors.join(" ")}
      </p>

      <ActionButton
        className=" flex w-full place-content-end gap-x-2 xl:hidden 2xl:hidden xs:visible"
        onEditClick={() => void router.push(`/edit-takeaway/${props.id}`)}
        onDeleteClick={() => deleteTakeaway.mutate({ id: props.id })}
      />
    </div>
  );
}
