import React from "react";
import { Link } from "react-router-dom";
import { pastors } from "../lib/data";

export default function OurPastors() {
  const ref = React.useRef(null);

  return (
    <div className="bg-cream-default text-dark-green-default py-40">
      <div className="grid grid-cols-4">
        <div className="col-span-1 my-auto -rotate-90 whitespace-nowrap h-fit">
          <h1 className="text-7xl text-green-default">Our Pastors</h1>
          {/* <div className="h-[2px] bg-green-default"></div> */}
        </div>

        <div ref={ref} className="col-span-3 flex flex-col gap-y-8 pr-40 text-green-default">
          {pastors.map((pastor) => (
            <div className="grid grid-cols-3 my-5 gap-x-20 items-center">
              <div className="col-span-2 flex flex-col">
                <p className="text-5xl mb-2 text-dark-green-default">{pastor.name}</p>
                <p className="text-2xl 2xl:mr-20">{pastor.description}</p>

                <div className="mt-4 self-start underline underline-offset-2">
                  <Link to={"/pastors"}>Learn more</Link>
                </div>
              </div>

              <div className="bg-green-default rounded-full h-64 w-64 overflow-hidden border-4 border-green-default">
                <img src={pastor.img} alt="Chen" className="rounded-lg object-cover" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
