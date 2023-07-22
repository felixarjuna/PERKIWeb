import Chen from "../images/Chen.png";
import Pandya from "../images/Pandya.png";
import Steffen from "../images/Steffen.png";

import { ParallaxImage } from "./ui/parallax-image";
import { VisionAndMission } from "./vision-and-mission";

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
      </div>

      <VisionAndMission />
    </div>
  );
}
