import { LinkIcon } from "lucide-react";

import Link from "next/link";
import Navigation from "~/components/navigation";
import ScheduleList from "./schedule-list";

export default function Schedule() {
  return (
    <section className="min-h-screen bg-dark-green-default pb-40 text-cream-default">
      <Navigation showNav={true} />
      <div className="flex flex-col items-center px-10 pt-20 xs:px-12 xs:pt-20">
        <div className="flex max-w-5xl flex-col items-center justify-center gap-8 px-14 py-16 pb-4 xs:w-full xs:px-0 xs:py-8">
          <h1 className="font-reimbrandt text-9xl xs:text-4xl">Schedule</h1>
          <div className="flex flex-col gap-y-2 text-2xl xs:text-base">
            <p>
              “There is a time for everything, and a season for every activity
              under the heavens.”
            </p>
            <p>– Ecclesiastes 3:1</p>
          </div>
        </div>

        <div className="w-full max-w-5xl px-14 xs:px-0">
          <div className="mt-8 w-fit rounded-lg bg-green-default/60 p-3 px-6 xs:text-sm">
            <h3>
              You find something&apos;s missing? Add them{" "}
              <Link href="/create-schedule" className="">
                <span className="inline-flex items-center gap-x-1 underline underline-offset-2">
                  <p>here</p>
                  <LinkIcon className="h-4 w-4 xs:h-3 xs:w-3" />
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
