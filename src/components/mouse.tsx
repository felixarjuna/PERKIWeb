"use client";

import { motion } from "motion/react";
import type React from "react";
import { cn } from "~/lib/utils";

interface IMouse extends React.HTMLAttributes<HTMLDivElement> {
  blur?: boolean;
  r: number; // radius in rem
  x: number; // x position
  y: number; // y position
}

export default function Mouse({ r, x, y, className, blur = true }: IMouse) {
  return (
    <motion.div
      animate={{
        transition: { duration: 0.5 },
        x: x - (r * 16) / 2,
        y: y - (r * 16) / 2,
      }}
      className={cn(
        "pointer-events-none absolute z-10 rounded-full border border-accent bg-white mix-blend-difference",
        className,
        blur && "blur-3xl filter"
      )}
      style={{ height: `${r}rem`, width: `${r}rem` }}
    />
  );
}
