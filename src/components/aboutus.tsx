import React from "react";

export default function AboutUs() {
  return (
    <>
      <div className="h-screen p-12 bg-green-default text-light-green-default font-founders">
        <div className="flex-col items-center gap-2 ">
          <div className="flex items-center gap-2 pb-6">
            <h1 className="text-4xl ">About Us</h1>
            <div className="h-[1px] w-24 bg-light-green-default"></div>
          </div>
        </div>
        <div>
          <p className="max-w-[829px] text-justify text-3xl pb-40">
            <span className="font-lora text-5xl ">Perki</span> stands for
            Persekutuan Kristen Indonesia and is a Christian fellowship that
            bases its beliefs, teachings and life on the entire content of the
            Old and New Testament Bibles which it recognizes as the inspired
            Words of God.
          </p>
        </div>
        <div>
          <p className="float-right max-w-[829px] text-right text-3xl pb-40">
            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Rem
            pariatur sint veritatis reprehenderit magni tempore numquam ullam
            perferendis voluptatibus optio! Lorem ipsum dolor sit, amet
            consectetur adipisicing elit. Quibusdam, minima.
          </p>
        </div>
      </div>
    </>
  );
}
