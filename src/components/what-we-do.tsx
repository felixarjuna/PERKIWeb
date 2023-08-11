import { Link } from "react-router-dom";
import Perki from "../assets/images/S__3186691.jpg";
import { events } from "../lib/data";

export default function Home() {
  return (
    <div className="bg-cream-default text-dark-green-default">
      <div className="flex items-center justify-center pb-20">
        <img src={Perki} alt="perki" className="w-full object-cover" />
      </div>

      <div className="grid grid-cols-4">
        <div className="my-auto -rotate-90 col-span-1 whitespace-nowrap h-fit xs:col-span-4 xs:rotate-0 xs:mb-4">
          <h1 className="text-8xl text-green-default font-reimbrandt xs:text-4xl xs:text-center">
            What We Do
          </h1>
          {/* <div className="h-[2px] bg-green-default"></div> */}
        </div>

        <div className="col-span-3 grid grid-cols-2 gap-28 pr-40 xs:col-span-4 xs:gap-12 xs:pr-0">
          {events.map((event, index) => {
            return (
              <div key={index} className="max-w-lg flex flex-col xs:col-span-2 xs:mx-8">
                <h1 className="text-3xl xs:text-2xl font-reimbrandt">{event.name}</h1>
                {/* <div className="h-[2px] w-[312px] bg-dark-green-default -translate-y-1"></div> */}
                <div className="mt-2 text-xl xs:text-sm bg-green-default rounded-lg w-fit items-center flex text-cream-default py-2 px-4 xs:px-2 xs:py-1 xs:mt-1">
                  <p>{event.time} </p>
                </div>
                <p className="text-xl mt-4 xs:text-base xs:mt-2">{event.description}</p>
                <div className="mt-4 self-end underline underline-offset-2 xs:text-sm">
                  <Link to={"/activity"}>Learn more</Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
