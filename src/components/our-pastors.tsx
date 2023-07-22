import { motion, useScroll, useTransform } from "framer-motion";
import React from "react";
import Chen from "../images/Chen.png";
import { pastors } from "../lib/data";

export default function OurPastors() {
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
  });

  const deg = useTransform(scrollYProgress, [0, 1], ["10deg", "0deg"]);

  return (
    <div className="bg-cream-default text-dark-green-default py-40">
      <div className="flex items-center gap-x-32">
        <div className="ml-16 -rotate-90 whitespace-nowrap h-fit">
          <h1 className="text-5xl text-green-default">Our Pastors</h1>
          <div className="h-[2px] bg-green-default"></div>
        </div>

        <div ref={ref} className="flex flex-col">
          {pastors.map((pastor) => (
            <div className="flex flex-row my-5">
              <p className="text-2xl max-w-lg text-justify mr-20">
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Architecto consequuntur
                cupiditate accusantium necessitatibus modi delectus saepe magni id facilis adipisci,
                quas doloremque beatae provident, nesciunt veniam distinctio laudantium velit animi.
              </p>
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
