import React from "react";
import Chen from "../images/Chen.png";
import Pandya from "../images/Pandya.png";
import Steffen from "../images/Steffen.png";

export default function AboutUs() {
  return (
    <>
      <div className="bg-dark-green-default text-light-green-default font-founders">
        <div className="flex-col items-center gap-2 p-12">
          <div className="flex items-center gap-2 ">
            <h1 className="text-4xl ">About Us</h1>
            <div className="h-[1px] w-24 bg-light-green-default"></div>
          </div>
        </div>

        <div className="flex flex-row gap-10 px-24">
          <p className="max-w-[830px] text-justify text-3xl pt-12">
            <span className="font-lora text-5xl ">Perki</span> stands for
            Persekutuan Kristen Indonesia and is a Christian fellowship that
            bases its beliefs, teachings and life on the entire content of the
            Old and New Testament Bibles which it recognizes as the inspired
            Words of God.
          </p>
          <img src={Chen} alt="Chen" />
        </div>

        <div className="px-24 ">
          <p className="float-right max-w-[860px] text-justify text-3xl pt-24">
            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Rem
            pariatur sint veritatis reprehenderit magni tempore numquam ullam
            perferendis voluptatibus optio! Lorem ipsum dolor sit, amet
            consectetur adipisicing elit. Quibusdam, minima.
          </p>
          <img src={Steffen} alt="Steffen" />
        </div>

        <div className="flex flex-row gap-10 px-24">
          <p className="max-w-[830px] text-justify text-3xl pt-24">
            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Rem
            pariatur sint veritatis reprehenderit magni tempore numquam ullam
            perferendis voluptatibus optio! Lorem ipsum dolor sit, amet
            consectetur adipisicing elit. Quibusdam, minima.
          </p>
          <img src={Pandya} alt="Pandya" />
        </div>
        <div className="pb-14">
          <div className="h-[1px] w-screen bg-light-green-default mb-10"></div>
          <div className="flex flex-row justify-center items-center gap-2 p-12">
            <div className="h-[1px] w-24 bg-light-green-default"></div>
            <h1 className="text-4xl ">Make Disciples of All Nations</h1>
            <div className="h-[1px] w-24 bg-light-green-default"></div>
          </div>
          <div className="flex flex-row justify-center text-center gap-10">
            <div className="flex flex-col gap-5 justify-center items-center p-1 max-w-[500px]">
              <h1 className="text-4xl">Vision</h1>
              <p className="text-2xl">
                Become a church based on the Full Gospel to take root, grow and
                bear fruit for Christ.
              </p>
            </div>
            <div className="flex flex-col gap-5 justify-center items-center p-12 max-w-[500px]">
              <h1 className="text-4xl">Mission</h1>
              <p className="text-2xl">
                Building a Christian family that loves and serves God and
                people.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
