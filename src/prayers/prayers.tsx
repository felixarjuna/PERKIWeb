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
      <div className="pt-20 px-24 flex flex-col items-center">
        <div className="flex w-1/2 items-center justify-center gap-8 py-16 flex-col">
          <h1 className="text-9xl font-reimbrandt">Pray together</h1>
          <div className="text-2xl flex flex-col gap-y-2">
            <p>
              “Therefore, I tell you, whatever you ask in prayer, believe that you have received it,
              and it will be yours.”
            </p>
            <p>– Mark 11:24</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-2xl font-reimbrandt">
            Let's pray together every Wednesday at 18.00 a.m 😍
          </h3>
        </div>

        <div className="flex flex-col w-1/2 justify-center items-center gap-y-4 mt-4 ">
          <div className="self-start flex gap-x-4 w-full">
            <input
              className="px-8 py-4 flex-1 bg-green-default/70 rounded-lg placeholder-cream-default outline-none font-reimbrandt text-xl"
              type="text"
              placeholder="Insert your prayer here ..."
              value={prayer}
              onChange={(e) => {
                setPrayer(e.target.value);
              }}
            />
            <button
              className="bg-green-default/70 px-4 py-2 rounded-lg flex items-center gap-x-1 hover:bg-green-default"
              onClick={() => onAddPrayer(prayer)}
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </div>

          <div className="bg-green-default/80 w-full rounded-lg px-8 py-4 min-h-[300px]">
            <h2 className="text-3xl font-reimbrandt">Prayer's list</h2>
            <ul className="flex flex-col gap-2 my-4">
              {prayers.map((prayer) => {
                return <li className="text-xl">{prayer}</li>;
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
