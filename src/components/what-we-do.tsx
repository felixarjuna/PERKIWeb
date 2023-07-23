import Perki from "../assets/images/S__3186691.jpg";
import { events } from "../lib/data";

export default function Home() {
  return (
    <div className="bg-cream-default text-dark-green-default py-40">
      <div className="flex items-center justify-center px-40 pb-40">
        <img src={Perki} alt="perki" className="rounded-lg" />
      </div>

      <div className="flex items-center">
        <div className="-rotate-90 whitespace-nowrap h-fit">
          <h1 className="text-7xl text-green-default">What We Do</h1>
          {/* <div className="h-[2px] bg-green-default"></div> */}
        </div>

        <div className="grid grid-cols-2 gap-28">
          {events.map((event) => {
            return (
              <div className="max-w-xl">
                <h1 className="text-3xl">{event.name}</h1>
                {/* <div className="h-[2px] w-[312px] bg-dark-green-default -translate-y-1"></div> */}
                <div className="mt-2 text-xl bg-green-default rounded-lg w-fit items-center flex text-cream-default p-2">
                  <p>{event.time} </p>
                </div>
                <p className="text-xl mt-4">{event.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
