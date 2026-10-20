import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { BusFront, Clock3, MapPin } from "lucide-react";
import { buttonVariants } from "~/components/ui/button";
import { DISCORD_INVITE_URL } from "~/lib/data";
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

          <div className="flex gap-3">
            <DiscordLogoIcon
              aria-hidden="true"
              className="mt-1 size-5 shrink-0"
            />
            <div>
              <dt className="type-subheading">Hang out online</dt>
              <dd className="mt-1">
                Our Discord is where we study and game together. Drop by and
                hang out, even before your first visit.
                <span className="mt-3 block">
                  <a
                    className={buttonVariants({
                      className: "text-foreground",
                      size: "sm",
                      variant: "outline",
                    })}
                    href={DISCORD_INVITE_URL}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <DiscordLogoIcon aria-hidden="true" className="size-4" />
                    Join our Discord
                  </a>
                </span>
              </dd>
            </div>
          </div>
        </dl>

        <MapEmbed />
      </div>
    </Section>
  );
}
