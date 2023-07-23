import Chen from "../assets/images/Chen.png";
import Learn from "../assets/images/Learn.jpg";
import Pandya from "../assets/images/Pandya.png";
import Steffen from "../assets/images/Steffen.png";

import { ParallaxImage } from "./ui/parallax-image";
import { VisionAndMission } from "./vision-and-mission";

export default function AboutUs() {
  return (
    <div className="bg-dark-green-default text-light-green-default py-20">
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
            Our fellowship is not affiliated with any particular church group. All activities are
            aimed at supporting the Realization of the Great Commission of the Lord Jesus Christ.
          </p>
          <ParallaxImage img={Steffen} className="left-5" />
        </div>

        <div className="flex flex-row relative">
          <p className="max-w-7xl text-5xl z-10 tracking-normal">
            We seek to foster a strong sense of community and spiritual growth among our members,
            encouraging ourselves to live out their faith authentically and share the message of
            God's love and salvation with others.
          </p>
          <ParallaxImage img={Pandya} />
        </div>

        <div className="flex flex-row relative justify-end pb-60">
          <p className="max-w-7xl text-5xl z-10 tracking-normal">
            Through regular gatherings, prayer meetings, and outreach programs, our members are
            equipped to serve as ambassadors of Christ in their local communities and beyond. But
            still, we are just sinners who want to grow together. :)
          </p>
          <ParallaxImage img={Learn} className="left-5 w-[35rem]" />
        </div>
      </div>

      <VisionAndMission />
    </div>
  );
}
