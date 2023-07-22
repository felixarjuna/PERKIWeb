import Chen from "../images/Chen.png";
import Pandya from "../images/Pandya.png";
import Steffen from "../images/Steffen.png";

import { ParallaxImage } from "./ui/parallax-image";

export default function AboutUs() {
  return (
    <div className="bg-dark-green-default text-light-green-default font-satoshi py-20">
      <div className="px-24">
        <div className="flex items-center justify-center gap-8 py-16 ">
          <h1 className="text-9xl">About Us</h1>
          {/* <Separator className="h-1 rounded-sm" /> */}
        </div>
      </div>

      <div className="mt-20 px-44 overflow-hidden flex flex-col gap-y-80">
        <div className="flex flex-row relative">
          <p className="max-w-7xl text-5xl z-10 tracking-normal">
            <span className="font-lora text-7xl">Perki</span> stands for Persekutuan Kristen
            Indonesia and is a Christian fellowship that bases its beliefs, teachings and life on
            the entire content of the Old and New Testament Bibles which it recognizes as the
            inspired Words of God.
          </p>
          <ParallaxImage img={Chen} />
        </div>

        <div className="flex flex-row relative justify-end">
          <p className="max-w-7xl text-5xl z-10 tracking-normal">
            <span className="font-lora text-7xl">Perki</span> stands for Persekutuan Kristen
            Indonesia and is a Christian fellowship that bases its beliefs, teachings and life on
            the entire content of the Old and New Testament Bibles which it recognizes as the
            inspired Words of God.
          </p>
          <ParallaxImage img={Steffen} className="left-5" />
        </div>

        <div className="flex flex-row relative pb-60">
          <p className="max-w-7xl text-5xl z-10 tracking-normal">
            <span className="font-lora text-7xl">Perki</span> stands for Persekutuan Kristen
            Indonesia and is a Christian fellowship that bases its beliefs, teachings and life on
            the entire content of the Old and New Testament Bibles which it recognizes as the
            inspired Words of God.
          </p>
          <ParallaxImage img={Pandya} />
        </div>

        {/* <div className="pb-14">
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
                Become a church based on the Full Gospel to take root, grow and bear fruit for
                Christ.
              </p>
            </div>
            <div className="flex flex-col gap-5 justify-center items-center p-12 max-w-[500px]">
              <h1 className="text-4xl">Mission</h1>
              <p className="text-2xl">
                Building a Christian family that loves and serves God and people.
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
