"use client";

import { useState } from "react";
import { AdminSelect } from "../admin-controls";
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
    <div className="space-y-5">
      <AdminSelect
        className="w-full sm:w-56"
        id="takeaway-view"
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
