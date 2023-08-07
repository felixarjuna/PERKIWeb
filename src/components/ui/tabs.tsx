import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: { id: string; label: string }[];
}

const contents = [
  {
    tabId: "church-service",
    title: "The heart of a disciple 1",
    date: "Aug 24",
    speaker: "Pdt. John Kusuma",
    bibleVerse: "Genesis 1:26-28",
    summary: "summary",
    author: "Felix Arjuna",
  },
  {
    tabId: "church-service",
    title: "The heart of a disciple 2",
    date: "Aug 24",
    speaker: "Pdt. John Kusuma",
    bibleVerse: "Genesis 1:26-28",
    summary: "summary",
    author: "Ricky Jonathan",
  },
  {
    tabId: "bg-bible-study",
    title: "hello world 1",
    date: "Aug 24",
    speaker: "Pdt. John Kusuma",
    bibleVerse: "Genesis 1:26-28",
    summary: "summary",
    author: "Steffen Josua",
  },
  {
    tabId: "bg-bible-study",
    title: "hello world 2",
    date: "Aug 24",
    speaker: "Pdt. John Kusuma",
    bibleVerse: "Genesis 1:26-28",
    summary: "summary",
    author: "Danny Kurniawan",
  },
  {
    tabId: "sg-bible-study",
    title: "Dosa",
    date: "Aug 24",
    speaker: "Group 1",
    bibleVerse: "Genesis 1:26-28",
    summary: "summary",
    author: "Danny Kurniawan",
  },
  {
    tabId: "sg-bible-study",
    title: "Hamartia",
    date: "Aug 24",
    speaker: "Group 2",
    bibleVerse: "Genesis 1:26-28 | Genesis 2:1-10",
    summary: "summary",
    author: "Danny Kurniawan",
  },
];

export default function Tabs({ tabs, className }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(tabs[0].id);

  return (
    <div className="space-y-8">
      <div className={cn("flex space-x-1", className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-4 py-2 text-cream-default transition",
              activeTab === tab.id && "hover:text-cream-default/60"
            )}
            style={{
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {activeTab === tab.id && (
              <motion.span
                layoutId="bubble"
                className="absolute inset-0 bg-cream-default z-10 mix-blend-difference"
                style={{ borderRadius: 8 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
              />
            )}
            <p>{tab.label}</p>
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {contents
          .filter((x) => x.tabId === activeTab)
          .map((content, index) => {
            return (
              <TabContent
                key={index}
                tabId={content.tabId}
                title={content.title}
                date={content.date}
                speaker={content.speaker}
                bibleVerse={content.bibleVerse}
                summary={content.summary}
                author={content.author}
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
  author: string;
}

function TabContent(props: TabContentProps) {
  return (
    <div className="p-6 bg-green-default/60 rounded-lg w-full hover:bg-green-default/80 shadow-lg transition duration-300 cursor-pointer">
      <h1 className="text-xl font-reimbrandt tracking-wide">{props.title}</h1>
      <div className="flex items-center gap-x-2 text-green-400/80 font-reimbrandt">
        <p>{props.speaker}</p>
        <span>&middot;</span>
        <p>{props.bibleVerse}</p>
        <span>&middot;</span>
        <p>{props.date}</p>
        <span>&middot;</span>
        <p>{props.author}</p>
      </div>
      <p className="mt-4">{props.summary}</p>
    </div>
  );
}
