"use client";

import { useState } from "react";
import { AdminSegmented } from "../admin-controls";
import TakeawayManager from "./takeaway-manager";
import { WriterAssignments } from "./writer-assignments";

export default function TakeawayViews({ staff }: { staff: boolean }) {
  const [view, setView] = useState(staff ? "all" : "mine");
  const options = [
    { label: "My takeaways", value: "mine" },
    ...(staff ? [{ label: "All assignments", value: "assignments" }] : []),
    { label: "All takeaways", value: "all" },
  ];
  return (
    <div className="@container space-y-5">
      <AdminSegmented
        className="h-auto @sm:w-auto w-full [&_button[data-state=on]]:underline [&_button]:h-auto [&_button]:min-h-11 [&_button]:min-w-0 [&_button]:whitespace-normal @sm:[&_button]:whitespace-nowrap @sm:[&_button]:px-4 [&_button]:px-2 [&_button]:py-2 [&_button]:underline-offset-4"
        label="View"
        onChange={setView}
        options={options}
        value={view}
      />
      {view === "all" ? (
        <TakeawayManager />
      ) : (
        <WriterAssignments key={view} staff={view === "assignments"} />
      )}
    </div>
  );
}
