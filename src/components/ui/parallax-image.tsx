import { motion, useScroll, useTransform } from "framer-motion";
import React from "react";
import { cn } from "../../lib/utils";

interface ParallaxImageProps extends React.HTMLAttributes<HTMLDivElement> {
  img: string;
}

export const ParallaxImage = ({ img, className }: ParallaxImageProps) => {
  const targetRef = React.useRef(null);

  const { scrollYProgress } = useScroll({
    // container: containerRef,
    target: targetRef,
    // offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-40%", "40%"]);

  return (
    <motion.div
      style={{ y }}
      ref={targetRef}
      className={cn("absolute right-5 top-0 rounded-lg", className)}
    >
      <img src={img} alt="Chen" className="scale-125 filter brightness-50 rounded-lg" />
    </motion.div>
  );
};
