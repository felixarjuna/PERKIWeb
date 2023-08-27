"use client";

import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import React from "react";

interface ParallaxImageProps extends React.HTMLAttributes<HTMLDivElement> {
  img: string;
  alt: string;
  width: number;
  height: number;
}

export const ParallaxImage = ({ img, alt, width, height, className }: ParallaxImageProps) => {
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
      <Image
        src={img}
        className="scale-125 filter brightness-50 rounded-lg lg:scale-110 md:scale-95 sm:scale-75 xs:scale-75"
        alt={alt}
        width={width}
        height={height}
        quality={100}
      />
    </motion.div>
  );
};
