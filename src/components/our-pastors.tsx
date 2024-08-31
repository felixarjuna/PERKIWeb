import Image from "next/image";
import React from "react";
import { pastors } from "../lib/data";
import { buttonVariants } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export default function OurPastors() {
  const ref = React.useRef(null);

  return (
    <div className="bg-cream-default py-40 text-dark-green-default xs:py-20">
      <div className="grid grid-cols-4">
        <div className="col-span-1 my-auto h-fit -rotate-90 whitespace-nowrap xs:col-span-4 xs:mb-4 xs:rotate-0">
          <h1 className="font-reimbrandt text-8xl text-green-default xs:text-center xs:text-4xl">
            Our Pastors
          </h1>
          {/* <div className="h-[2px] bg-green-default"></div> */}
        </div>

        <div
          ref={ref}
          className="col-span-3 flex flex-col gap-y-8 pr-40 text-green-default xs:col-span-4 xs:gap-y-4 xs:pr-0"
        >
          {pastors.map((pastor, index) => (
            <div
              className="my-5 grid grid-cols-3 items-center gap-x-20 sm:gap-x-0 xs:mx-8"
              key={index}
            >
              <div className="col-span-2 flex flex-col xs:col-span-3">
                <p className="mb-2 font-reimbrandt text-5xl text-dark-green-default xs:text-2xl">
                  {pastor.name}
                </p>
                <p className="text-2xl 2xl:mr-20 xs:mr-0 xs:text-base">
                  {pastor.favoriteVerse}
                </p>

                <div className="mt-4 self-start underline underline-offset-2 xs:text-sm">
                  <Dialog>
                    <DialogTrigger
                      className={buttonVariants({
                        variant: "default",
                        size: "sm",
                      })}
                    >
                      see more ...
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-xl">
                          {pastor.name}
                        </DialogTitle>
                        <DialogDescription>{pastor.story}</DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="h-64 w-64 overflow-hidden rounded-full border-4 border-green-default bg-green-default xs:col-span-3 xs:mx-auto xs:mt-8 xs:h-44 xs:w-44">
                <Image
                  src={pastor.img}
                  alt="Chen"
                  className="mx-auto rounded-lg object-cover"
                  width={500}
                  height={500}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
