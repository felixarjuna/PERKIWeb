import React from "react";
import { getVOTD } from "../api/api";

export default function Home() {
  const [verse, setVerse] = React.useState<string>("hello");

  React.useEffect(() => {
    const getVerse = async () => {
      const verse = await getVOTD();
      setVerse(verse);
    };
    getVerse();
  }, []);

  return (
    <>
      <div className="absolute top-10 h-[0.7px] bg-black/10 w-[90%] inset-x-0 mx-auto"></div>
      <div className="absolute top-20 w-full">
        <div className="relative flex overflow-hidden gap-1 text-3xl">
          <div className="flex gap-4 animate-marquee whitespace-nowrap bg-black/10 w-full items-center justify-center uppercase">
            <p className="">{verse}</p>
          </div>
        </div>
      </div>
      <div className="h-screen flex items-center justify-center flex-col border-t-[0.7px] border-black/10 text-green-default gap-7">
        <h3 className="font-satoshi text-3xl">Welcome to our fellowship</h3>
        <h1 className="font-lora text-9xl">Perki Aachen</h1>
        <div className="flex gap-20">
          <div className="flex items-center uppercase gap-2 text-2xl font-satoshi">
            <p>since</p>
            <div className="h-[1px] w-24 bg-green-default"></div>
            <p className="font-satoshi">1990</p>
          </div>
          <div className="font-satoshi text-2xl uppercase">
            Non-denominational church
          </div>
        </div>
      </div>
    </>
  );
}
