import React from "react";
import { useIntersection } from "react-use";

import Navigation from "./navigation";

import ParallaxImage from "./parallax-image";
import VisionAndMission from "./vision-and-mission";

export default function AboutUs() {
  const [showNav, setShowNav] = React.useState<boolean>(false);
  const intersectionRef = React.useRef(null);
  const intersection = useIntersection(intersectionRef, {
    root: null,
    rootMargin: "0px",
    threshold: 1,
  });

  React.useEffect(() => {
    if (intersection && intersection.boundingClientRect.y < 0) {
      setShowNav(true);
      return;
    }

    if (intersection && intersection.intersectionRatio < 1) setShowNav(false);
    else if (intersection && intersection?.intersectionRatio == 1)
      setShowNav(true);
  }, [intersection, intersection?.boundingClientRect]);

  return (
    <div className="relative bg-dark-green-default py-20 text-light-green-default">
      <Navigation showNav={showNav} />

      <div className="px-24">
        <div className="flex items-center justify-center gap-8">
          <h1 className="font-reimbrandt text-9xl tracking-wide sm:text-5xl md:text-6xl lg:text-7xl xs:text-4xl">
            About Us
          </h1>
          {/* <Separator className="h-1 rounded-sm" /> */}
        </div>
      </div>

      <div className="mt-20 flex flex-col gap-y-72 overflow-hidden px-28 sm:gap-y-48 sm:px-12 md:gap-y-52 md:px-16 lg:gap-y-56 lg:px-20 xl:gap-y-64 xl:px-24 xs:gap-y-44 xs:px-8">
        <div ref={intersectionRef} className="relative flex flex-row">
          <p className="z-10 max-w-[90%] text-6xl leading-[4.5rem] sm:text-2xl sm:leading-[2.5rem] md:text-3xl md:leading-[3rem] lg:text-4xl lg:leading-[3.5rem] xl:text-5xl xl:leading-[4rem] xs:text-xl xs:leading-[2rem]">
            <span className="font-reimbrandt text-8xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl xs:text-3xl">
              Perki
            </span>{" "}
            stands for Persekutuan Kristen Indonesia and is a Christian
            fellowship that bases its beliefs, teachings and life on the entire
            content of the Old and New Testament Bibles which it recognizes as
            the inspired Words of God.
          </p>
          <ParallaxImage
            img={"/images/chen.png"}
            alt="Photo of Chen"
            width={400}
            height={400}
          />
        </div>

        <div className="relative flex flex-row justify-end">
          <p className="z-10 max-w-[90%] text-right text-6xl leading-[4.5rem] sm:text-2xl sm:leading-[2.5rem] md:text-3xl md:leading-[3rem] lg:text-4xl lg:leading-[3.5rem] xl:text-5xl xl:leading-[4rem] xs:text-xl xs:leading-[2rem]">
            Our fellowship is not affiliated with any particular church group.
            All activities are aimed at supporting the Realization of the Great
            Commission of the Lord Jesus Christ.
          </p>
          <ParallaxImage
            img={"/images/steffen.png"}
            className="left-0"
            alt="Photo of Steffen"
            width={400}
            height={400}
          />
        </div>

        <div className="relative flex flex-row">
          <p className="z-10 max-w-[90%] text-6xl leading-[4.5rem] sm:text-2xl sm:leading-[2.5rem] md:text-3xl md:leading-[3rem] lg:text-4xl lg:leading-[3.5rem] xl:text-5xl xl:leading-[4rem] xs:text-xl xs:leading-[2rem]">
            We seek to foster a strong sense of community and spiritual growth
            among our members, encouraging ourselves to live out their faith
            authentically and share the message of God&apos;s love and salvation
            with others.
          </p>
          <ParallaxImage
            img={"/images/pandya.png"}
            alt="Photo of Pandya"
            width={400}
            height={400}
          />
        </div>

        <div className="relative flex flex-row justify-end pb-60 xs:pb-24">
          <p className="z-10 max-w-[90%] text-right text-6xl leading-[4.5rem] sm:text-2xl sm:leading-[2.5rem] md:text-3xl md:leading-[3rem] lg:text-4xl lg:leading-[3.5rem] xl:text-5xl xl:leading-[4rem] xs:text-xl xs:leading-[2rem]">
            Through regular gatherings, prayer meetings, and outreach programs,
            our members are equipped to serve as ambassadors of Christ in their
            local communities and beyond. But still, we are just sinners who
            want to grow together :)
          </p>
          <ParallaxImage
            img={"/images/learn.jpg"}
            className="left-16 w-[900px] xs:bottom-20 xs:left-0"
            alt="Photo of people learning together"
            width={600}
            height={600}
          />
        </div>
      </div>

      <VisionAndMission />
    </div>
  );
}
