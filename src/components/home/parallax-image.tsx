import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import React from "react";
import { cn } from "~/lib/utils";

interface ParallaxImageProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly img: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

export default function ParallaxImage({
  img,
  alt,
  width,
  height,
  className,
}: ParallaxImageProps) {
  const targetRef = React.useRef(null);

  const { scrollYProgress } = useScroll({ target: targetRef });

  const y = useTransform(scrollYProgress, [0, 1], ["-40%", "40%"]);

  return (
    <motion.div
      className={cn("absolute top-0 right-5 rounded-lg", className)}
      ref={targetRef}
      style={{ y }}
    >
      <Image
        alt={alt}
        className="scale-75 rounded-lg brightness-50 filter sm:scale-75 md:scale-95 lg:scale-110 2xl:scale-125"
        height={height}
        quality={100}
        src={img}
        width={width}
      />
    </motion.div>
  );
}
