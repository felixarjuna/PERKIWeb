import Navigation from "~/components/navigation";
import { services } from "~/lib/data";

export default function Activity() {
  return (
    <section className="bg-dark-green-default pb-40 text-cream-default">
      <Navigation showNav={true} />
      <div className="px-24 pt-20">
        <div className="flex items-center justify-center gap-8 py-16 ">
          <h1 className="font-reimbrandt text-9xl">Activities</h1>
          {/* <Separator className="h-1 rounded-sm" /> */}
        </div>
      </div>

      <div className="flex flex-col space-y-16 px-44">
        {services.map((service, index) => {
          return (
            <div key={index} className="space-y-4 text-2xl">
              <h1 className="font-reimbrandt text-6xl">{service.title}</h1>
              {service.description}
            </div>
          );
        })}
      </div>
    </section>
  );
}
