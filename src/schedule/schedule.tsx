import { LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "../components/ui/navigation";
import ScheduleList from "./schedule-list";

export default function Schedule() {
  return (
    <section className="bg-dark-green-default text-cream-default pb-40 min-h-screen">
      <Navigation showNav={true} />
      <div className="pt-20 px-10 flex flex-col items-center xs:px-12 xs:pt-20">
        <div className="flex max-w-5xl px-14 items-center justify-center gap-8 py-16 pb-4 flex-col xs:w-full xs:py-8 xs:px-0">
          <h1 className="text-9xl font-reimbrandt xs:text-4xl">Schedule</h1>
          <div className="text-2xl flex flex-col gap-y-2 xs:text-base">
            <p>
              “There is a time for everything, and a season for every activity under the heavens.”
            </p>
            <p>– Ecclesiastes 3:1</p>
          </div>
        </div>

        <div className="max-w-5xl w-full xs:px-0 px-14">
          <div className="px-6 p-3 bg-green-default/60 mt-8 rounded-lg w-fit xs:text-sm">
            <h3>
              You find something's missing? Add them{" "}
              <Link to="/create-schedule" className="">
                <span className="inline-flex items-center gap-x-1 underline underline-offset-2">
                  <p>here</p>
                  <LinkIcon className="w-4 h-4 xs:w-3 xs:h-3" />
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
