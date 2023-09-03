import { MapPin } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <div className="relative bg-cream-default text-dark-green-default">
        <div className="relative">
          <MapPin className="absolute inset-0 bottom-12 left-16 mx-auto my-auto h-12 w-12 text-green-default/80" />
          <Image
            src={"/images/mapsicleMap.png"}
            alt="MapsicleMap"
            className="h-screen w-screen object-cover"
            width={2000}
            height={2000}
            quality={100}
          />
          <div className="absolute bottom-0 left-0 z-0 flex h-full w-[1/3] flex-col justify-center gap-y-8 bg-cream-default/60 px-16 text-2xl text-green-default 2xl:w-1/4 2xl:px-20 xs:h-1/3 xs:w-full xs:text-sm">
            <div>
              <h1>FEG Aachen Germany</h1>
              <p>Roermonderstr. 110</p>
              <p>52072, Aachen</p>
            </div>
            <div>
              <h1>Visit us on Saturday at 15:30</h1>
              <p>See you there! 😉</p>
            </div>
          </div>
          <h1 className="absolute inset-0 top-20 z-20 mx-auto text-center font-reimbrandt text-9xl text-green-default xs:text-4xl ">
            Where Are We
          </h1>
        </div>
      </div>
    </>
  );
}
