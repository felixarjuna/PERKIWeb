"use client";

import { ExternalLink, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";

const PLACE = "Roermonderstraße 110, 52072 Aachen";
const MAPS_URL = "https://maps.app.goo.gl/R7QCeJGbNyHqiCZKA";
const LAT = 50.7859;
const LON = 6.072_92;
const SPAN_LAT = 0.004;
const SPAN_LON = 0.007;
const EMBED_URL = `https://www.openstreetmap.org/export/embed.html?bbox=${LON - SPAN_LON},${LAT - SPAN_LAT},${LON + SPAN_LON},${LAT + SPAN_LAT}&layer=mapnik&marker=${LAT},${LON}`;

/**
 * Two-click map: a static preview with the venue pinned, and the live
 * OpenStreetMap only after the visitor asks for it, so no third party
 * loads before they choose to (see /privacy).
 */
export default function MapEmbed() {
  const [live, setLive] = useState(false);

  if (live) {
    return (
      <iframe
        allowFullScreen
        className="aspect-[4/3] w-full rounded-xl border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={EMBED_URL}
        title={`OpenStreetMap of ${PLACE}`}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl">
        <Image
          alt={`Street map of the area around ${PLACE}`}
          className="aspect-[4/3] w-full object-cover"
          height={700}
          sizes="(min-width: 1024px) 40rem, 100vw"
          src="/images/mapsicleMap.png"
          width={1440}
        />

        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center"
        >
          <Badge size="status" variant="surface">
            Roermonderstraße 110
          </Badge>
          <MapPin className="mt-1 size-8 fill-background text-foreground drop-shadow" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="text-foreground"
            onClick={() => setLive(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            <MapPin aria-hidden="true" className="size-4" />
            Open interactive map
          </Button>
          <a
            className={buttonVariants({
              className: "text-foreground",
              size: "sm",
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
        <p className="type-caption text-paper-foreground">
          The interactive map is loaded from OpenStreetMap when you open it.{" "}
          <Link className="underline underline-offset-4" href="/privacy">
            Privacy policy
          </Link>
        </p>
      </div>
    </div>
  );
}
