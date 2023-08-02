import { MapPin } from "lucide-react";
import MapsicleMap from "../assets/images/MapsicleMap.png";

export default function Home() {
  return (
    <>
      <div className=" bg-cream-default text-dark-green-default">
        <div className="relative">
          <h1 className="text-8xl text-green-default text-center absolute inset-0 mx-auto top-20 font-reimbrandt">
            Where Are We
          </h1>
          <MapPin className="w-12 h-12 absolute inset-0 mx-auto my-auto left-16 bottom-12 text-green-default/80" />
          <img src={MapsicleMap} alt="MapsicleMap" className="object-cover h-screen w-screen" />
          <div className="absolute bg-green-default/80 h-full w-[1/3] 2xl:w-1/4 top-0 left-0 text-cream-default text-2xl flex flex-col justify-center gap-y-8 px-16 2xl:px-20">
            <div>
              <h1>FEG Aachen Germany</h1>
              <p>Roermonderstr. 110</p>
              <p>52072, Aachen</p>
            </div>
            <div>
              <h1>Visit us on Saturday at 15:30</h1>
              <p>See you there!</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
