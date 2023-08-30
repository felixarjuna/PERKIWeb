"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

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
      style={{ width: `${r}rem`, height: `${r}rem` }}
      className={cn(
        `absolute rounded-full border border-green-default z-10`,
        className,
        blur && "filter blur-3xl"
      )}
    ></motion.div>
  );
}
