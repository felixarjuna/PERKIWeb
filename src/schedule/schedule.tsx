import Navigation from "../components/ui/navigation";
import ScheduleList from "./schedule-list";

export default function Schedule() {
  return (
    <section className="bg-dark-green-default text-cream-default pb-40 min-h-screen">
      <Navigation showNav={true} />
      <div className="pt-20 px-24 flex flex-col items-center">
        <div className="flex w-1/2 items-center justify-center gap-8 pt-16 pb-4 flex-col">
          <h1 className="text-9xl font-reimbrandt">Schedule</h1>
          <div className="text-2xl flex flex-col gap-y-2">
            <p>
              “There is a time for everything, and a season for every activity under the heavens.”
            </p>
            <p>– Ecclesiastes 3:1</p>
          </div>
        </div>

        <div className="self-start px-[25rem] w-full">
          <ScheduleList />
        </div>
      </div>
    </section>
  );
}
