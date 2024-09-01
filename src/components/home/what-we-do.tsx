import { cn } from "~/lib/utils";
import { events } from "../../lib/data";
import { buttonVariants } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export default function WhatWeDo() {
  return (
    <div className="grid gap-y-8 bg-cream-default py-16 text-dark-green-default">
      <div className="grid grid-cols-4">
        <div className="col-span-4 my-auto mb-4 h-fit rotate-0 whitespace-nowrap sm:col-span-1 sm:-rotate-90">
          <h1 className="text-center font-reimbrandt text-4xl text-green-default sm:text-8xl">
            What We Do
          </h1>
        </div>

        <div className="col-span-4 flex flex-col gap-y-8 pr-0 text-green-default sm:col-span-3 sm:gap-y-8 sm:pr-40">
          {events.map((event, index) => {
            return (
              <div
                key={index}
                className="col-span-2 mx-8 flex max-w-lg flex-col"
              >
                <h1 className="font-reimbrandt text-2xl sm:text-3xl">
                  {event.name}
                </h1>

                <div className="mt-1 flex w-fit items-center rounded-lg bg-green-default px-3  py-2 text-sm text-cream-default sm:mt-2 sm:px-4 sm:text-xl">
                  <p>{event.time} </p>
                </div>
                <p className="mt-2 text-base sm:mt-4 sm:text-xl">
                  {event.notes}
                </p>

                <div className="mt-4 self-end text-sm underline underline-offset-2">
                  <Dialog>
                    <DialogTrigger
                      className={cn(
                        buttonVariants({
                          variant: "default",
                          size: "sm",
                        }),
                      )}
                    >
                      see more ...
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-xl">
                          {event.name}
                        </DialogTitle>
                        <DialogDescription>
                          {event.description}
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
