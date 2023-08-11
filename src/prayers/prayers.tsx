import { Plus } from "lucide-react";
import React from "react";
import Navigation from "../components/ui/navigation";

export default function Prayers() {
  const [prayers, setPrayers] = React.useState<string[]>([]);

  const onAddPrayer = (prayer: string) => {
    setPrayers((prevPrayers) => [...prevPrayers, prayer]);
  };

  const [prayer, setPrayer] = React.useState<string>("");

  return (
    <section className="bg-dark-green-default text-cream-default pb-40 min-h-screen">
      <Navigation showNav={true} />
      <div className="pt-20 px-10 flex flex-col items-center xs:px-12 xs:pt-20">
        <div className="flex max-w-5xl px-14 items-center justify-center gap-8 py-16 flex-col xs:w-full xs:py-8 xs:px-0">
          <h1 className="text-9xl font-reimbrandt xs:text-4xl">Pray together</h1>
          <div className="text-2xl flex flex-col gap-y-2 xs:text-base">
            <p>
              “Therefore, I tell you, whatever you ask in prayer, believe that you have received it,
              and it will be yours.”
            </p>
            <p>– Mark 11:24</p>
          </div>
        </div>

        <div className="flex flex-col max-w-5xl w-full px-14 gap-y-4 mt-4 xs:w-full xs:px-0">
          <h3 className="text-2xl font-reimbrandt xs:text-base mb-8 xs:mb-4">
            Let's pray together every Wednesday at 18.30 a.m 😍
          </h3>

          <div className="self-start flex gap-x-4 w-full xs:gap-2">
            <input
              className="px-8 py-4 flex-1 bg-green-default/70 rounded-lg placeholder-cream-default outline-none text-xl xs:text-sm xs:px-4 xs:py-3"
              type="text"
              placeholder="Insert your prayer here ..."
              value={prayer}
              onChange={(e) => {
                setPrayer(e.target.value);
              }}
            />
            <button
              className="bg-green-default/70 px-4 py-2 rounded-lg flex items-center gap-x-1 hover:bg-green-default xs:text-xs xs:px-2 xs:py-1"
              onClick={() => onAddPrayer(prayer)}
            >
              <Plus className="w-5 h-5 xs:w-4 xs:h-4" />
              Add
            </button>
          </div>

          <div className="bg-green-default/80 w-full rounded-lg px-8 py-4 min-h-[300px] xs:px-4 xs:py-2">
            <h2 className="text-3xl font-reimbrandt xs:text-xl">Prayer's list</h2>
            <ul className="flex flex-col gap-2 my-4 xs:my-2">
              {prayers.map((prayer) => {
                return <li className="text-xl xs:text-base">{prayer}</li>;
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
