"use client";

import Navigation from "@/components/navigation";
import { useToast } from "@/components/ui/use-toast";
import AddScheduleForm from "./add-schedule-form";

export default function AddSchedulePage() {
  const { toast } = useToast();
  return (
    <section className="bg-dark-green-default text-cream-default pb-40 min-h-screen">
      <Navigation showNav={true} />

      <div className="pt-20 px-24 flex flex-col items-center xs:px-12">
        <div className="flex w-1/2 items-center justify-center gap-8 py-16 pb-4 flex-col xs:w-full xs:py-8">
          <h1 className="text-9xl font-reimbrandt xs:text-4xl">Schedule</h1>
          <div className="text-2xl flex flex-col gap-y-2 xs:text-base">
            <p>
              “There is a time for everything, and a season for every activity under the heavens.”
            </p>
            <p>– Ecclesiastes 3:1</p>
          </div>
        </div>

        <div className="w-1/2 xs:w-full">
          <AddScheduleForm />
        </div>
      </div>
    </section>
  );
}
