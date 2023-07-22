import { CircleBackground } from "./ui/circle-background";

export default function Homepage() {
  return (
    <>
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
        <h3 className="font-satoshi text-3xl">Welcome to our fellowship</h3>
        <h1 className="font-lora text-[160px]">Perki Aachen</h1>
        <div className="flex gap-20">
          <div className="flex items-center uppercase gap-2 text-2xl font-satoshi">
            <p>since</p>
            <div className="h-[1px] w-24 bg-green-default"></div>
            <p className="font-satoshi">1990</p>
          </div>
          <div className="font-satoshi text-2xl uppercase">Non-denominational church</div>
        </div>
      </div>
    </>
  );
}
