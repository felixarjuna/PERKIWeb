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
        <div className="my-auto -rotate-90 col-span-1 whitespace-nowrap h-fit">
          <h1 className="text-7xl text-green-default">What We Do</h1>
          {/* <div className="h-[2px] bg-green-default"></div> */}
        </div>

        <div className="col-span-3 grid grid-cols-2 gap-28 pr-40">
          {events.map((event) => {
            return (
              <div className="max-w-lg flex flex-col">
                <h1 className="text-3xl">{event.name}</h1>
                {/* <div className="h-[2px] w-[312px] bg-dark-green-default -translate-y-1"></div> */}
                <div className="mt-2 text-xl bg-green-default rounded-lg w-fit items-center flex text-cream-default p-2 px-4">
                  <p>{event.time} </p>
                </div>
                <p className="text-xl mt-4">{event.description}</p>
                <div className="mt-4 self-end underline underline-offset-2">
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
