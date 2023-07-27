import React from "react";
import { Link } from "react-router-dom";
import { pastors } from "../lib/data";

export default function OurPastors() {
  const ref = React.useRef(null);

  return (
    <div className="bg-cream-default text-dark-green-default py-40">
      <div className="flex items-center">
        <div className="ml-7 -rotate-90 whitespace-nowrap h-fit">
          <h1 className="text-7xl text-green-default">Our Pastors</h1>
          {/* <div className="h-[2px] bg-green-default"></div> */}
        </div>

        <div ref={ref} className="flex flex-col gap-y-8">
          {pastors.map((pastor) => (
            <div className="flex my-5 gap-x-20 items-center">
              <div className="flex flex-col">
                <p className="text-5xl mb-2">{pastor.name}</p>
                <p className="text-2xl max-w-2xl mr-20">{pastor.description}</p>

                <div className="mt-4 self-end underline underline-offset-2 -translate-x-20">
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
