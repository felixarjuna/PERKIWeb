import Navigation from "@/components/navigation";
import { services } from "@/lib/data";

export default function Activity() {
  return (
    <section className="bg-dark-green-default text-cream-default pb-40">
      <Navigation showNav={true} />
      <div className="pt-20 px-24">
        <div className="flex items-center justify-center gap-8 py-16 ">
          <h1 className="text-9xl font-reimbrandt">Activities</h1>
          {/* <Separator className="h-1 rounded-sm" /> */}
        </div>
      </div>

      <div className="px-44 space-y-16 flex flex-col">
        {services.map((service, index) => {
          return (
            <div key={index} className="space-y-4 text-2xl">
              <h1 className="text-6xl font-reimbrandt">{service.title}</h1>
              {service.description}
            </div>
          );
        })}
      </div>
    </section>
  );
}
