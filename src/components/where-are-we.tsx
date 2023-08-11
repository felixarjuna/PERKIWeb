import { MapPin } from "lucide-react";
import MapsicleMap from "../assets/images/MapsicleMap.png";

export default function Home() {
  return (
    <>
      <div className="bg-cream-default text-dark-green-default relative">
        <div className="relative">
          <MapPin className="w-12 h-12 absolute inset-0 mx-auto my-auto left-16 bottom-12 text-green-default/80" />
          <img src={MapsicleMap} alt="MapsicleMap" className="object-cover h-screen w-screen" />
          <div className="absolute bg-cream-default/60 h-full w-[1/3] 2xl:w-1/4 bottom-0 left-0 text-green-default text-2xl flex flex-col justify-center gap-y-8 px-16 2xl:px-20 z-0 xs:text-sm xs:w-full xs:h-1/3">
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
          <h1 className="absolute text-9xl text-green-default text-center inset-0 mx-auto top-20 font-reimbrandt xs:text-4xl z-20 ">
            Where Are We
          </h1>
        </div>
      </div>
    </>
  );
}
