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
          <p>– Ecclesiastes 3:1</p>
        </div>
      }
      title="Schedule"
    >
      <ScheduleList />
    </Template>
  );
}
