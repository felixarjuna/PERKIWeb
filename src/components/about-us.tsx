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
        <div className="flex items-center justify-center gap-8">
          <h1 className="text-9xl tracking-tight lg:text-7xl md:text-6xl sm:text-5xl xs:text-4xl">About Us</h1>
          {/* <Separator className="h-1 rounded-sm" /> */}
        </div>
      </div>

      <div className="mt-20 overflow-hidden flex flex-col px-28 gap-y-72 xl:px-24 xl:gap-y-64 lg:px-20 lg:gap-y-56 md:px-16 md:gap-y-52 sm:px-12 sm:gap-y-48 xs:px-8 xs:gap-y-44">
        <div className="flex flex-row relative">
          <p className="max-w-[90%] text-6xl z-10 leading-[4.5rem] xl:text-5xl xl:leading-[4rem] lg:text-4xl lg:leading-[3.5rem] md:text-3xl md:leading-[3rem] sm:text-2xl sm:leading-[2.5rem] xs:text-xl xs:leading-[2rem]">
            <span className="font-lora text-8xl xl:text-7xl lg:text-6xl md:text-5xl sm:text-4xl xs:text-3xl">Perki</span> stands for Persekutuan Kristen
            Indonesia and is a Christian fellowship that bases its beliefs, teachings and life on
            the entire content of the Old and New Testament Bibles which it recognizes as the
            inspired Words of God.
          </p>
          <ParallaxImage img={Chen} />
        </div>

        <div className="flex flex-row relative justify-end">
          <p className="max-w-[90%] text-right text-6xl z-10 leading-[4.5rem] xl:text-5xl xl:leading-[4rem] lg:text-4xl lg:leading-[3.5rem] md:text-3xl md:leading-[3rem] sm:text-2xl sm:leading-[2.5rem] xs:text-xl xs:leading-[2rem]">
            Our fellowship is not affiliated with any particular church group. All activities are
            aimed at supporting the Realization of the Great Commission of the Lord Jesus Christ.
          </p>
          <ParallaxImage img={Steffen} className="left-0" />
        </div>

        <div className="flex flex-row relative">
          <p className="max-w-[90%] text-6xl z-10 leading-[4.5rem] xl:text-5xl xl:leading-[4rem] lg:text-4xl lg:leading-[3.5rem] md:text-3xl md:leading-[3rem] sm:text-2xl sm:leading-[2.5rem] xs:text-xl xs:leading-[2rem]">
            We seek to foster a strong sense of community and spiritual growth among our members,
            encouraging ourselves to live out their faith authentically and share the message of
            God's love and salvation with others.
          </p>
          <ParallaxImage img={Pandya} />
        </div>

        <div className="flex flex-row relative justify-end pb-60">
          <p className="max-w-[90%] text-right text-6xl z-10 leading-[4.5rem] xl:text-5xl xl:leading-[4rem] lg:text-4xl lg:leading-[3.5rem] md:text-3xl md:leading-[3rem] sm:text-2xl sm:leading-[2.5rem] xs:text-xl xs:leading-[2rem]">
            Through regular gatherings, prayer meetings, and outreach programs, our members are
            equipped to serve as ambassadors of Christ in their local communities and beyond. But
            still, we are just sinners who want to grow together :)
          </p>
          <ParallaxImage img={Learn} className="left-0 w-[900px]" />
        </div>
      </div>

      <VisionAndMission />
    </div>
  );
}
