import { BusFront, Clock3, MapPin, NavigationIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function WhereAreWe() {
  return (
    <div className="relative bg-paper text-paper-foreground">
      <div className="relative">
        <h1 className="absolute inset-0 top-16 z-20 mx-auto h-fit w-fit rounded-xl bg-accent/90 px-6 py-2 text-center font-reimbrandt text-4xl text-foreground sm:text-9xl">
          Navigation
        </h1>

        <Image
          alt="MapsicleMap"
          className="h-screen w-screen object-cover"
          height={4000}
          src={"/images/mapsicleMap.png"}
          width={4000}
        />

        <div className="absolute inset-0 bottom-12 left-16 mx-auto my-auto h-fit w-fit animate-bounce rounded-lg bg-accent/80 p-2 text-foreground">
          <MapPin className="h-5 w-5" />
        </div>

        <div className="absolute bottom-0 left-0 z-20 flex h-fit w-full flex-col justify-center gap-y-4 bg-paper/60 px-8 py-8 text-base text-paper-foreground sm:flex-row sm:items-start sm:justify-center sm:gap-8 sm:gap-y-8 sm:px-20 sm:text-2xl">
          <Link
            className="flex items-center gap-2"
            href={
              "https://maps.app.goo.gl/R7QCeJGbNyHqiCZKA?g_st=com.google.maps.preview.copy"
            }
            target="_blank"
          >
            <NavigationIcon className="h-5 w-5" />

            <p className="flex underline underline-offset-2">
              Open in Google Maps
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
            </p>
          </Link>

          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 sm:mt-1" />
            <div>
              <p>Roermonderstr. 110</p>
              <p>52072, Aachen</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <BusFront className="h-5 w-5 sm:mt-1" />
            <div className="grid gap-2">
              <p>Bendplatz / Jupp-Müller-Straße</p>
              <div className="flex items-center gap-2 text-sm">
                <p className="rounded-md bg-accent px-2 text-foreground">7</p>
                <p className="rounded-md bg-accent px-2 text-foreground">27</p>
                <p className="rounded-md bg-accent px-2 text-foreground">37</p>
                <p className="rounded-md bg-accent px-2 text-foreground">47</p>
                <p className="rounded-md bg-accent px-2 text-foreground">147</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5" />
            <h1>Saturday, 15:30 till drop.</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
