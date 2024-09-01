import Image from "next/image";
import { pastors } from "../../lib/data";
import { buttonVariants } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export default function OurPastors() {
  return (
    <div className="bg-cream-default py-20 text-green-default sm:py-40">
      <div className="grid grid-cols-4 gap-y-4">
        <div className="col-span-4 my-auto flex h-full items-center justify-center whitespace-nowrap sm:col-span-1 sm:translate-y-[50%] sm:items-start sm:justify-start">
          <h1 className="text-center font-reimbrandt text-4xl sm:-rotate-90 sm:text-8xl">
            Our Pastors
          </h1>
        </div>

        <div className="col-span-4 flex flex-col gap-y-4 pr-0  sm:col-span-3 sm:gap-y-8 sm:pr-40">
          {pastors.map((pastor, index) => (
            <div
              className="grid grid-cols-3 items-center gap-x-20 px-8 sm:gap-x-0"
              key={index}
            >
              <div className="col-span-3 flex flex-col sm:col-span-2">
                <p className="mb-2 font-reimbrandt text-2xl sm:text-5xl">
                  {pastor.name}
                </p>
                <p className="mr-0 text-base sm:text-2xl 2xl:mr-20">
                  {pastor.favoriteVerse}
                </p>

                <div className="mt-4 self-start text-sm underline underline-offset-2">
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

              <div className="col-span-3 mx-auto mt-8 aspect-square h-44 overflow-hidden rounded-full border-4 border-green-default bg-green-default sm:h-64">
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
