import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: { id: string; label: string }[];
}

export default function Tabs({ tabs, className }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(tabs[0].id);

  return (
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
  );
}
