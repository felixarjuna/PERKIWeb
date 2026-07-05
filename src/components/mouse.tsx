"use client";

import { motion } from "motion/react";
import type React from "react";
import { cn } from "~/lib/utils";

interface IMouse extends React.HTMLAttributes<HTMLDivElement> {
  r: number; // radius in rem
  x: number; // x position
  y: number; // y position
  blur?: boolean;
}

export default function Mouse({ r, x, y, className, blur = true }: IMouse) {
  return (
    <motion.div
      animate={{
        x: x - (r * 16) / 2,
        y: y - (r * 16) / 2,
        transition: { duration: 0.5 },
      }}
      className={cn(
        "pointer-events-none absolute z-10 rounded-full border border-accent bg-white mix-blend-difference",
        className,
        blur && "blur-3xl filter"
      )}
      style={{ width: `${r}rem`, height: `${r}rem` }}
    />
  );
}
