"use client";

import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "~/components/ui/button";

const PLACE = "Roermonderstraße 110, 52072 Aachen";
const LAT = 50.7859;
const LON = 6.072_92;
const SPAN_LAT = 0.004;
const SPAN_LON = 0.007;
const EMBED_URL = `https://www.openstreetmap.org/export/embed.html?bbox=${LON - SPAN_LON},${LAT - SPAN_LAT},${LON + SPAN_LON},${LAT + SPAN_LAT}&layer=mapnik&marker=${LAT},${LON}`;

/**
 * Two-click map: a static preview with the venue pinned, and the live
 * OpenStreetMap only after the visitor asks for it, so no third party
 * loads before they choose to (see /datenschutz).
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
        <span className="rounded-full bg-background px-3 py-1 text-foreground text-xs shadow-lg">
          Roermonderstraße 110
        </span>
        <MapPin className="mt-1 size-8 fill-background text-foreground drop-shadow" />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-paper/90 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-paper-foreground text-xs">
          The live map is loaded from OpenStreetMap when you open it.{" "}
          <Link className="underline underline-offset-4" href="/datenschutz">
            Datenschutz
          </Link>
        </p>
        <Button
          className="shrink-0 text-foreground"
          onClick={() => setLive(true)}
          size="sm"
          type="button"
          variant="outline"
        >
          Open interactive map
        </Button>
      </div>
    </div>
  );
}
