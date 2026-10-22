"use client";

import { SidebarMenuBadge } from "~/components/ui/sidebar";
import { api } from "~/trpc/react";
import { assignmentQueryOptions } from "./writer-assignments";

export function AssignmentReminder() {
  const { data } = api.writerAssignments.mine.useQuery(
    undefined,
    assignmentQueryOptions
  );
  return data?.reminderCount ? (
    <SidebarMenuBadge>
      <span>
        {data.reminderCount}
        <span className="sr-only"> takeaways to write</span>
      </span>
    </SidebarMenuBadge>
  ) : null;
}
