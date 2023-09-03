import Image from "next/image";
import Link from "next/link";
import React from "react";
import { pastors } from "../lib/data";

export default function OurPastors() {
  const ref = React.useRef(null);

  return (
    <div className="bg-cream-default text-dark-green-default py-40 xs:py-20">
      <div className="grid grid-cols-4">
        <div className="col-span-1 my-auto -rotate-90 whitespace-nowrap h-fit xs:col-span-4 xs:rotate-0 xs:mb-4">
          <h1 className="text-8xl text-green-default font-reimbrandt xs:text-4xl xs:text-center">
            Our Pastors
          </h1>
          {/* <div className="h-[2px] bg-green-default"></div> */}
        </div>

        <div
          ref={ref}
          className="col-span-3 flex flex-col gap-y-8 pr-40 text-green-default xs:pr-0 xs:col-span-4 xs:gap-y-4"
        >
          {pastors.map((pastor, index) => (
            <div
              className="grid grid-cols-3 my-5 gap-x-20 items-center xs:mx-8 sm:gap-x-0"
              key={index}
            >
              <div className="col-span-2 flex flex-col xs:col-span-3">
                <p className="text-5xl mb-2 text-dark-green-default xs:text-2xl font-reimbrandt">
                  {pastor.name}
                </p>
                <p className="text-2xl 2xl:mr-20 xs:text-base xs:mr-0">{pastor.favoriteVerse}</p>

                <div className="mt-4 self-start underline underline-offset-2 xs:text-sm">
                  <Link href={"/pastors"}>Learn more</Link>
                </div>
              </div>

              <div className="bg-green-default rounded-full h-64 w-64 overflow-hidden border-4 border-green-default xs:h-44 xs:w-44 xs:mt-8 xs:col-span-3 xs:mx-auto">
                <Image
                  src={pastor.img}
                  alt="Chen"
                  className="rounded-lg object-cover mx-auto"
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
