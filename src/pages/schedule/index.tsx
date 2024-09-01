import { Plus } from "lucide-react";

import Link from "next/link";
import Template from "~/components/template";
import ScheduleList from "./schedule-list";

export default function Schedule() {
  return (
    <Template
      title="Schedule"
      subtitle={
        <div className="flex flex-col gap-y-2 text-base sm:text-2xl">
          <p>
            “There is a time for everything, and a season for every activity
            under the heavens.”
          </p>
          <p>– Ecclesiastes 3:1</p>
        </div>
      }
    >
      <div className="mt-8 flex w-full max-w-5xl flex-col px-0 sm:px-14">
        <Link
          href={"/create-schedule"}
          className="flex w-fit items-center gap-1 self-end rounded-lg bg-green-default/60 p-3 px-4 text-sm"
        >
          <Plus className="aspect-square w-4" />
          <p>Add schedule</p>
        </Link>

        <ScheduleList />
      </div>
    </Template>
  );
}
