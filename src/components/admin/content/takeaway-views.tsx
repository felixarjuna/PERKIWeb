"use client";

import { ClipboardList, Files, UserPen } from "lucide-react";
import { useState } from "react";
import { AdminSegmented } from "../admin-controls";
import TakeawayManager from "./takeaway-manager";
import { WriterAssignments } from "./writer-assignments";

export default function TakeawayViews({ staff }: { staff: boolean }) {
  const [view, setView] = useState(staff ? "all" : "mine");
  const options = [
    { icon: UserPen, label: "Mine", value: "mine" },
    ...(staff
      ? [
          {
            icon: ClipboardList,
            label: "Assignments",
            value: "assignments",
          },
        ]
      : []),
    { icon: Files, label: "All", value: "all" },
  ];
  return (
    <div className="@container space-y-5">
      <AdminSegmented
        className="@sm:w-auto w-full [&_button]:min-w-0 [&_button]:whitespace-nowrap @sm:[&_button]:px-4 [&_button]:px-3"
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
