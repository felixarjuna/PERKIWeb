import React from "react";
import Navigation from "../components/ui/navigation";

export default function Takeaway() {
  const [takeaways, setPrayers] = React.useState<string[]>([]);

  const onAddTakeaways = (prayer: string) => {
    setPrayers((prevPrayers) => [...prevPrayers, prayer]);
  };

  const [prayer, setPrayer] = React.useState<string>("");

  return (
    <section className="bg-dark-green-default text-cream-default pb-40 min-h-screen">
      <Navigation showNav={true} />

      <div className="pt-20 px-24 flex flex-col items-center">
        <div className="flex w-1/2 items-center justify-center gap-8 py-16 flex-col">
          <h1 className="text-9xl font-reimbrandt">Takeaways</h1>
          <div className="text-2xl flex flex-col gap-y-2">
            <p>“Your word is a lamp to my feet and a light to my path”</p>
            <p>– Psalm 119:105</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-2xl font-reimbrandt">
            Let's keep burning each other and grow together 🔥
          </h3>
        </div>
      </div>
    </section>
  );
}
