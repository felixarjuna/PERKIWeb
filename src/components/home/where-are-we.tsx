import { BusFront, Clock3, MapPin, NavigationIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function WhereAreWe() {
  return (
    <div className="relative bg-cream-default text-dark-green-default">
      <div className="relative">
        <h1 className="absolute inset-0 top-16 z-20 mx-auto h-fit w-fit rounded-xl bg-green-default/90 px-6 py-2 text-center font-reimbrandt text-4xl text-light-green-default  sm:text-9xl">
          Navigation
        </h1>

        <Image
          src={"/images/mapsicleMap.png"}
          alt="MapsicleMap"
          className="h-screen w-screen object-cover"
          width={4000}
          height={4000}
          quality={100}
        />

        <div className="absolute inset-0 bottom-12 left-16 mx-auto my-auto h-fit w-fit  animate-bounce rounded-lg bg-green-default/80 p-2 text-light-green-default">
          <MapPin className="h-5 w-5" />
        </div>

        <div className="absolute bottom-0 left-0 z-20 flex h-fit w-full flex-col justify-center gap-y-4 bg-cream-default/60 px-8 py-8 text-base text-green-default sm:text-2xl 2xl:flex-row 2xl:items-start 2xl:justify-center 2xl:gap-8 2xl:gap-y-8 2xl:px-20">
          <Link
            target="_blank"
            href={
              "https://maps.app.goo.gl/R7QCeJGbNyHqiCZKA?g_st=com.google.maps.preview.copy"
            }
            className="flex items-center gap-2"
          >
            <div>
              <NavigationIcon className="h-5 w-5" />
            </div>
            <p className="flex underline underline-offset-2">
              Open in Google Maps
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-default"></span>
              </span>
            </p>
          </Link>

          <div className="flex gap-2">
            <MapPin className="h-5 w-5" />
            <div>
              <p>Roermonderstr. 110</p>
              <p>52072, Aachen</p>
            </div>
          </div>

          <div className="flex gap-2">
            <BusFront className="h-5 w-5" />
            <div className="grid gap-2">
              <p>Bendplatz / Jupp-Müller-Straße</p>
              <div className="flex items-center gap-2 text-sm">
                <p className="rounded-md bg-green-default px-2 text-light-green-default">
                  7
                </p>
                <p className="rounded-md bg-green-default px-2 text-light-green-default">
                  27
                </p>
                <p className="rounded-md bg-green-default px-2 text-light-green-default">
                  37
                </p>
                <p className="rounded-md bg-green-default px-2 text-light-green-default">
                  47
                </p>
                <p className="rounded-md bg-green-default px-2 text-light-green-default">
                  147
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Clock3 className="h-5 w-5" />
            <div>
              <h1>Saturday, 15:30 till drop. </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
