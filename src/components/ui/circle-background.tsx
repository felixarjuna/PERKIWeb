import { motion } from "framer-motion";
import React from "react";
import { cn } from "../../lib/utils";
import { calculateXAxes, calculateYAxes } from "./function";

interface IRoundedBackground extends React.HTMLAttributes<HTMLDivElement> {
  r: number; // radius in rem
  blur?: boolean;
  delay?: number;
  duration?: number;
  reverse?: boolean;
}

export const CircleBackground = ({
  r,
  className,
  delay = 0,
  blur = true,
  duration = 20,
  reverse = false,
}: IRoundedBackground) => {
  return (
    <motion.div
      layout
      animate={{
        x: reverse
          ? calculateXAxes(0.01, 850, -Math.PI, Math.PI).map((x) => x * -1)
          : calculateXAxes(0.01, 850, -Math.PI, Math.PI),
        y: reverse
          ? calculateYAxes(0.01, 850, -Math.PI, Math.PI)
          : calculateYAxes(0.01, 850, -Math.PI, Math.PI),
        transition: {
          duration: duration,
          repeat: Infinity,
          delay: delay,
        },
      }}
      style={{ width: `${r}rem`, height: `${r}rem` }}
      className={cn(
        `absolute rounded-full opacity-50 -z-10 filter animate-gradient-x mx-auto inset-0 `,
        className,
        blur && "blur-3xl"
      )}
    />
  );
};
