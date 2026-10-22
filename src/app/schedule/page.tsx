import { Suspense } from "react";
import Loader from "~/components/loader";
import Template from "~/components/template";
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
          <p>— Ecclesiastes 3:1</p>
        </div>
      }
      title="Schedule"
    >
      {/* The filters read the URL, which needs a Suspense boundary. */}
      <Suspense fallback={<Loader message="Loading the schedule…" />}>
        <ScheduleList />
      </Suspense>
    </Template>
  );
}
