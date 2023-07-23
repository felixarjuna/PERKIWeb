import { CircleBackground } from "./ui/circle-background";

export default function Homepage() {
  return (
    <div className="bg-cream-default">
      <div className="overflow-hidden">
        <CircleBackground
          r={90}
          blur
          className={
            "mix-blend-multiply bg-gradient-to-r from-light-green-400 via-green-400 to-dark-green-400 "
          }
        />
        <CircleBackground
          r={100}
          blur
          className={
            "mix-blend-multiply bg-gradient-to-r from-light-green-400 via-green-400 to-dark-green-400 "
          }
          duration={25}
          reverse
        />
      </div>

      <div className="h-screen flex items-center justify-center flex-col border-t-[0.7px] border-black/10 text-green-default gap-7 ">
        <h3 className="text-3xl uppercase">Welcome to our fellowship</h3>
        <h1 className="text-[160px]">Perki Aachen</h1>
        <div className="flex gap-20">
          <div className="flex items-center uppercase gap-2 text-3xl">
            <p>since</p>
            {/* <div className="h-[3px] w-24 bg-green-default"></div> */}
            <p>1990</p>
          </div>
          <div className="text-3xl uppercase">Non-denominational church</div>
        </div>
      </div>
    </div>
  );
}
