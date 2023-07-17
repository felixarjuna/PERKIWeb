import React from "react";
import Chen from "../images/Chen.png";
import Pandya from "../images/Pandya.png";
import Steffen from "../images/Steffen.png";

export default function AboutUs() {
  return (
    <>
      <div className="h-[1800px] p-12 bg-green-default text-light-green-default font-founders">
        <div className="flex-col items-center gap-2 ">
          <div className="flex items-center gap-2 pb-10">
            <h1 className="text-4xl ">About Us</h1>
            <div className="h-[1px] w-24 bg-light-green-default"></div>
          </div>
        </div>
        
          <div className="flex flex-row gap-10 pb-20">
            <p className="max-w-[830px] text-justify text-3xl ">
              <span className="font-lora text-5xl ">Perki</span> stands for
              Persekutuan Kristen Indonesia and is a Christian fellowship that
              bases its beliefs, teachings and life on the entire content of the
              Old and New Testament Bibles which it recognizes as the inspired
              Words of God.
            </p>
            <img src={Chen} alt="Chen" />
          </div>

          <div className="pb-20 ">
            <p className="float-right max-w-[830px] text-justify text-3xl ">
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Rem
              pariatur sint veritatis reprehenderit magni tempore numquam ullam
              perferendis voluptatibus optio! Lorem ipsum dolor sit, amet
              consectetur adipisicing elit. Quibusdam, minima.
            </p>
            <img src={Steffen} alt="Steffen" className="pl-28"/>
          </div>

          <div className="flex flex-row gap-10 pb-20">
            <p className=" max-w-[830px] text-justify text-3xl pb-40">
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Rem
              pariatur sint veritatis reprehenderit magni tempore numquam ullam
              perferendis voluptatibus optio! Lorem ipsum dolor sit, amet
              consectetur adipisicing elit. Quibusdam, minima.
            </p>
            <img src={Pandya} alt="Pandya" />
          </div>
      </div>
    </>
  );
}
