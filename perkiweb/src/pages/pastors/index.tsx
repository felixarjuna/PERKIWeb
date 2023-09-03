import Image from "next/image";
import Navigation from "~/components/navigation";
import { pastors } from "~/lib/data";

export default function Pastors() {
  return (
    <section className="bg-dark-green-default pb-40 text-cream-default">
      <Navigation showNav={true} />
      <div className="px-24 pt-20">
        <div className="flex items-center justify-center gap-8 py-16 ">
          <h1 className="font-reimbrandt text-9xl">Pastors</h1>
        </div>
      </div>

      <div className="flex flex-col space-y-24 px-44">
        {pastors.map((pastor, index) => {
          return (
            <div
              className="grid grid-cols-4 items-center gap-x-40"
              key={pastor.name}
            >
              <div key={index} className="col-span-3 space-y-4 text-2xl">
                <h1 className="font-reimbrandt text-6xl">{pastor.name}</h1>
                <p>{pastor.story}</p>
              </div>
              <div className=" h-64 w-64 overflow-hidden rounded-full border-4 border-green-default bg-green-default">
                <Image
                  src={pastor.img}
                  alt="Pastor image"
                  className="rounded-lg object-cover"
                  width={500}
                  height={500}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
