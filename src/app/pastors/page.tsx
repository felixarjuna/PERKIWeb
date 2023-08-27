import Navigation from "@/components/navigation";
import { pastors } from "@/lib/data";

export const Pastors = () => {
  return (
    <section className="bg-dark-green-default text-cream-default pb-40">
      <Navigation showNav={true} />
      <div className="pt-20 px-24">
        <div className="flex items-center justify-center gap-8 py-16 ">
          <h1 className="text-9xl font-reimbrandt">Pastors</h1>
        </div>
      </div>

      <div className="px-44 space-y-24 flex flex-col">
        {pastors.map((pastor, index) => {
          return (
            <div className="grid grid-cols-4 gap-x-40 items-center">
              <div key={index} className="col-span-3 text-2xl space-y-4">
                <h1 className="text-6xl font-reimbrandt">{pastor.name}</h1>
                <p>{pastor.story}</p>
              </div>
              <div className=" bg-green-default rounded-full h-64 w-64 overflow-hidden border-4 border-green-default">
                <img src={pastor.img} alt="Chen" className="rounded-lg object-cover" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
