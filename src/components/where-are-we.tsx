import MapsicleMap from "../images/MapsicleMap.png";

export default function Home() {
  return (
    <>
      <div className=" bg-cream-default text-dark-green-default font-satoshi">
        <h1 className="text-5xl font-bold text-center">Where Are We?</h1>
        <img src={MapsicleMap} alt="MapsicleMap" className="object-cover h-screen w-screen"/>
      </div>
    </>
  );
}
