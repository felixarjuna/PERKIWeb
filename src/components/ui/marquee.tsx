import React from "react";
import { getVOTD } from "../../api/api";

export const Marquee = () => {
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
    </>
  );
};
