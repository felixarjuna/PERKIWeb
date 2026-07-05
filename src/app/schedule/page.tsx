import { Plus } from "lucide-react";
import Link from "next/link";
import Template from "~/components/template";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import ScheduleList from "./schedule-list";

export default function SchedulePage() {
  return (
    <Template
      subtitle={
        <div className="flex flex-col gap-y-1">
          <p>
            “There is a time for everything, and a season for every activity
            under the heavens.”
          </p>
          <p>– Ecclesiastes 3:1</p>
        </div>
      }
      title="Schedule"
    >
      <Link
        className={cn(
          buttonVariants({ variant: "secondary", size: "sm" }),
          "gap-1 self-end"
        )}
        href={"/create-schedule"}
      >
        <Plus className="size-4" />
        Add schedule
      </Link>

      <ScheduleList />
    </Template>
  );
}
