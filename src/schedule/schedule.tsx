import { LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
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
          <div className="px-6 p-3 bg-green-default/60 mt-8 rounded-lg w-fit">
            <h3>
              You find something's missing? Add them{" "}
              <Link to="/create-schedule" className="">
                <span className="inline-flex items-center gap-x-1 underline underline-offset-2">
                  <p>here</p>
                  <LinkIcon className="w-4 h-4" />
                </span>
              </Link>
            </h3>
          </div>
          <ScheduleList />
        </div>
      </div>
    </section>
  );
}
