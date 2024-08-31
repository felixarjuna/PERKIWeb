import Image from "next/image";
import { cn } from "~/lib/utils";
import { events } from "../lib/data";
import { buttonVariants } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export default function Home() {
  return (
    <div className="bg-cream-default text-dark-green-default xs:pb-20">
      <div className="flex items-center justify-center pb-20">
        <Image
          src={"/images/perkiAachen.jpg"}
          alt="perki"
          className="w-full object-cover"
          width={2500}
          height={2500}
        />
      </div>

      <div className="grid grid-cols-4">
        <div className="col-span-1 my-auto h-fit -rotate-90 whitespace-nowrap xs:col-span-4 xs:mb-4 xs:rotate-0">
          <h1 className="font-reimbrandt text-8xl text-green-default xs:text-center xs:text-4xl">
            What We Do
          </h1>
          {/* <div className="h-[2px] bg-green-default"></div> */}
        </div>

        <div className="col-span-3 grid grid-cols-2 items-center gap-28 pr-40 xs:col-span-4 xs:gap-12 xs:pr-0">
          {events.map((event, index) => {
            return (
              <div
                key={index}
                className="flex max-w-lg flex-col xs:col-span-2 xs:mx-8"
              >
                <h1 className="font-reimbrandt text-3xl xs:text-2xl">
                  {event.name}
                </h1>
                {/* <div className="h-[2px] w-[312px] bg-dark-green-default -translate-y-1"></div> */}
                <div className="mt-2 flex w-fit items-center rounded-lg bg-green-default px-4 py-2 text-xl text-cream-default xs:mt-1 xs:px-3 xs:py-2 xs:text-sm">
                  <p>{event.time} </p>
                </div>
                <p className="mt-4 text-xl xs:mt-2 xs:text-base">
                  {event.notes}
                </p>
                <div className="mt-4 self-end underline underline-offset-2 xs:text-sm">
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
