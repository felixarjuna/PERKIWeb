import { CircleBackground } from "./ui/circle-background";

export default function Homepage() {
  return (
    <div className="bg-dark-green-default">
      <div className="overflow-hidden">
        <CircleBackground
          r={90}
          blur
          className={
            "mix-blend-multiply bg-gradient-to-r from-dark-green-500 via-dark-green-100 to-dark-green-500 "
          }
        />
        <CircleBackground
          r={100}
          blur
          className={
            "mix-blend-multiply bg-gradient-to-r from-dark-green-500 via-dark-green-100 to-dark-green-500 "
          }
          duration={25}
          reverse
        />
      </div>

      <div className="h-screen flex items-center justify-center flex-col text-light-green-default gap-5 ">
        <h3 className="text-[1.75vw] uppercase">Welcome to our fellowship</h3>
        <h1 className="text-[14vw] font-reimbrandt">Perki Aachen</h1>
        <div className="flex gap-20">
          <div className="flex items-center uppercase gap-2 text-[1.75vw]">
            <p>since</p>
            <div className="h-[0.1vw] w-[7vw] bg-light-green-default"></div>
            <p>1990</p>
          </div>
          <div className="text-[1.75vw] uppercase">Non-denominational church</div>
        </div>
      </div>
      <div className="h-[1px] opacity-10 w-screen bg-light-green-default"></div>
    </div>
  );
}
