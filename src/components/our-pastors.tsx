import { motion, useScroll, useTransform } from "framer-motion";
import React from "react";
import Chen from "../assets/images/Chen.png";
import { pastors } from "../lib/data";

export default function OurPastors() {
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
  });

  const deg = useTransform(scrollYProgress, [0, 1], ["10deg", "0deg"]);

  return (
    <div className="bg-cream-default text-dark-green-default py-40">
      <div className="flex items-center">
        <div className="ml-16 -rotate-90 whitespace-nowrap h-fit">
          <h1 className="text-7xl text-green-default">Our Pastors</h1>
          {/* <div className="h-[2px] bg-green-default"></div> */}
        </div>

        <div ref={ref} className="flex flex-col">
          {pastors.map((pastor) => (
            <div className="flex my-5">
              <div>
                <p className="text-3xl mb-2">{pastor.name}</p>
                <p className="text-lg max-w-lg mr-20">{pastor.description}</p>
              </div>
              <motion.div style={{ rotate: deg }} className="bg-green-default rounded-lg p-3">
                <img src={Chen} alt="Chen" className="rounded-lg" />
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
