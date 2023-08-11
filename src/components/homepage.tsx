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
        <h3 className="xs:text-xs xl:text-4xl 2xl:text-4xl uppercase">Welcome to our fellowship</h3>
        <h1 className="text-[14vw] font-reimbrandt">Perki Aachen</h1>
        <div className="flex gap-20 xs:gap-4">
          <div className="flex items-center uppercase gap-2 xs:text-[0.6rem] xl:text-4xl 2xl:text-4xl">
            <p>since</p>
            <div className="h-[0.1vw] w-[7vw] bg-light-green-default"></div>
            <p>1990</p>
          </div>
          <div className="xs:text-[0.6rem] xl:text-4xl 2xl:text-4xl uppercase">
            Non-denominational church
          </div>
        </div>
      </div>
      <div className="h-[1px] opacity-10 w-screen bg-light-green-default"></div>
    </div>
  );
}
