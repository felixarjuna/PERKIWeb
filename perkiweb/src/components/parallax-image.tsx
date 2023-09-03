import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import React from "react";
import { cn } from "~/lib/utils";

interface ParallaxImageProps extends React.HTMLAttributes<HTMLDivElement> {
  img: string;
  alt: string;
  width: number;
  height: number;
}

export default function ParallaxImage({
  img,
  alt,
  width,
  height,
  className,
}: ParallaxImageProps) {
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
        className="xs:scale-75 scale-125 rounded-lg brightness-50 filter sm:scale-75 md:scale-95 lg:scale-110"
        alt={alt}
        width={width}
        height={height}
        quality={100}
      />
    </motion.div>
  );
}
