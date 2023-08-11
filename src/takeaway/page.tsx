import Tabs from "@/components/ui/tabs";
import Navigation from "../components/ui/navigation";

const tabs = [
  { id: "church-service", label: "Church service" },
  { id: "bg-bible-study", label: "Big group bible study" },
  { id: "sg-bible-study", label: "Small group bible study" },
];

export default function Takeaway() {
  return (
    <section className="bg-dark-green-default text-cream-default pb-40 min-h-screen">
      <Navigation showNav={true} />

      <div className="pt-20 px-24 flex flex-col items-center xs:px-12 xs:pt-20">
        <div className="flex w-1/2 items-center justify-center gap-8 py-16 flex-col xs:w-full xs:py-8">
          <h1 className="text-9xl font-reimbrandt xs:text-4xl">Takeaways</h1>
          <div className="text-2xl flex flex-col gap-y-2 xs:text-base">
            <p>“Your word is a lamp to my feet and a light to my path”</p>
            <p>– Psalm 119:105</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-2xl font-reimbrandt xs:text-base">
            Let's share what you have learned, keep burning each other and grow together 🔥
          </h3>
        </div>

        <div className="self-start 2xl:px-[29rem] mt-4 w-full">
          <Tabs tabs={tabs} />
        </div>
      </div>
    </section>
  );
}
