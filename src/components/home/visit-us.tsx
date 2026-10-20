import { BusFront, Clock3, ExternalLink, MapPin } from "lucide-react";
import Image from "next/image";
import { buttonVariants } from "../ui/button";
import Section from "./section";

const MAPS_URL = "https://maps.app.goo.gl/R7QCeJGbNyHqiCZKA";
const busLines = ["7", "27", "37", "47", "147"] as const;

export default function VisitUs() {
  return (
    <Section eyebrow="Come and see" id="visit" title="Visit us" tone="paper">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
        <dl className="space-y-6 text-sm sm:text-base">
          <div className="flex gap-3">
            <Clock3 aria-hidden="true" className="mt-1 size-5 shrink-0" />
            <div>
              <dt className="font-reimbrandt text-lg tracking-wide sm:text-xl">
                When
              </dt>
              <dd className="mt-1">
                Saturdays from 15:30, with a shared meal after the service.
                Small group Bible study starts at 13:00.
              </dd>
            </div>
          </div>

          <div className="flex gap-3">
            <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0" />
            <div>
              <dt className="font-reimbrandt text-lg tracking-wide sm:text-xl">
                Where
              </dt>
              <dd className="mt-1">
                <address className="not-italic">
                  Roermonderstraße 110
                  <br />
                  52072 Aachen
                </address>
              </dd>
            </div>
          </div>

          <div className="flex gap-3">
            <BusFront aria-hidden="true" className="mt-1 size-5 shrink-0" />
            <div>
              <dt className="font-reimbrandt text-lg tracking-wide sm:text-xl">
                By bus
              </dt>
              <dd className="mt-1">
                Stop Bendplatz / Jupp-Müller-Straße
                <ul className="mt-2 flex flex-wrap gap-2">
                  {busLines.map((line) => (
                    <li
                      className="rounded-full bg-paper-foreground px-2 py-1 text-paper text-xs tabular-nums"
                      key={line}
                    >
                      Line {line}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </div>

          <div className="pt-2">
            <a
              className={buttonVariants({
                className: "text-foreground",
                variant: "outline",
              })}
              href={MAPS_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ExternalLink aria-hidden="true" className="size-4" />
              Open in Google Maps
            </a>
          </div>
        </dl>

        <a
          aria-label="Open the location in Google Maps"
          className="block overflow-hidden rounded-xl ring-offset-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper-foreground focus-visible:ring-offset-2"
          href={MAPS_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Image
            alt="Street map of the area around Roermonderstraße 110 in Aachen"
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 motion-safe:hover:scale-[1.02]"
            height={700}
            sizes="(min-width: 1024px) 40rem, 100vw"
            src="/images/mapsicleMap.png"
            width={1440}
          />
        </a>
      </div>
    </Section>
  );
}
