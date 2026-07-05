import { motion } from "motion/react";
import React from "react";
import { calculateXAxes, calculateYAxes, cn } from "~/lib/utils";

interface IRoundedBackground extends React.HTMLAttributes<HTMLDivElement> {
  r: number; // radius in rem
  blur?: boolean;
  delay?: number;
  duration?: number;
  reverse?: boolean;
}

export default function CircleBackground({
  r,
  className,
  delay = 0,
  blur = true,
  duration = 20,
  reverse = false,
}: IRoundedBackground) {
  const { x, y } = React.useMemo(() => {
    const xAxes = calculateXAxes(0.01, 850, -Math.PI, Math.PI);
    const yAxes = calculateYAxes(0.01, 850, -Math.PI, Math.PI);
    return {
      x: reverse ? xAxes.map((value) => value * -1) : xAxes,
      y: yAxes,
    };
  }, [reverse]);

  return (
    <motion.div
      animate={{
        x,
        y,
        transition: {
          duration,
          repeat: Number.POSITIVE_INFINITY,
          delay,
        },
      }}
      className={cn(
        "absolute inset-0 mx-auto animate-gradient-x rounded-full opacity-50 filter",
        className,
        blur && "blur-3xl"
      )}
      layout
      style={{ width: `${r}rem`, height: `${r}rem` }}
    />
  );
}
