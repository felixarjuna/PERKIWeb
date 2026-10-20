import { BusFront, Clock3, MapPin } from "lucide-react";
import MapEmbed from "./map-embed";
import Section from "./section";

const busLines = ["7", "27", "37", "47", "147"] as const;

export default function VisitUs() {
  return (
    <Section
      eyebrow="Come and see"
      id="visit"
      overlap
      title="Visit us"
      tone="paper"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
        <dl className="type-body space-y-6">
          <div className="flex gap-3">
            <Clock3 aria-hidden="true" className="mt-1 size-5 shrink-0" />
            <div>
              <dt className="type-subheading">When</dt>
              <dd className="mt-1">
                Saturdays from 15:30, with a shared meal after the service.
                Small group Bible study starts at 13:00.
              </dd>
            </div>
          </div>

          <div className="flex gap-3">
            <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0" />
            <div>
              <dt className="type-subheading">Where</dt>
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
              <dt className="type-subheading">By bus</dt>
              <dd className="mt-1">
                Stop Bendplatz / Jupp-Müller-Straße
                <ul className="mt-2 flex flex-wrap gap-2">
                  {busLines.map((line) => (
                    <li
                      className="type-caption rounded-full bg-paper-foreground px-2 py-1 text-paper tabular-nums"
                      key={line}
                    >
                      Line {line}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </div>
        </dl>

        <MapEmbed />
      </div>
    </Section>
  );
}
