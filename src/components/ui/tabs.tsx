"use client";

import { trpc } from "@/app/_trpc/client";
import { dateTimeFormatter } from "@/lib/utils";
import { isEmpty } from "lodash";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: { id: string; label: string }[];
}

export default function Tabs({ tabs, className }: TabsProps) {
  const { data } = trpc.takeaways.getTakeaways.useQuery();
  const [takeawayId, setTakeawayId] = React.useState<string>("");

  const takeaways = React.useMemo(() => {
    return isEmpty(takeawayId)
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
            <TabContent
              key={index}
              tabId={takeaway.takeawayId}
              title={takeaway.title}
              date={dateTimeFormatter(takeaway.date)}
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

interface TabContentProps {
  tabId: string;
  title: string;
  date: string;
  speaker: string;
  bibleVerse: string;
  summary: string;
  contributors: Array<string>;
}

function TabContent(props: TabContentProps) {
  return (
    <div className="p-6 bg-green-default/60 rounded-lg w-full hover:bg-green-default/80 shadow-lg transition duration-300 cursor-pointer xs:p-4">
      <h1 className="text-2xl font-reimbrandt tracking-wide xs:text-lg flex items-center justify-between">
        {props.title}
        <span className="bg-light-green-default text-green-default text-sm rounded-lg px-2 py-1 xs:text-xs xs:p-1">
          {props.tabId}
        </span>
      </h1>
      <div className="flex items-center gap-x-2 text-green-400/80 font-reimbrandt xs:text-xs xs:gap-1 xs:flex-wrap xs:mt-2">
        <p>{props.speaker}</p>
        <span>&middot;</span>
        <p>{props.bibleVerse}</p>
        <span>&middot;</span>
        <p>{props.date}</p>
        <span>&middot;</span>
      </div>
      <p className="mt-4 xs:text-sm">{props.summary}</p>
      <p className="xs:text-xs text-green-400/80 mt-4">{props.contributors}</p>
    </div>
  );
}
