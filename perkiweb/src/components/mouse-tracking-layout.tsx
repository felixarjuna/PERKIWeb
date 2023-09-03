"use client";

import React from "react";
import Mouse from "./mouse";

type Position = {
  x: number;
  y: number;
};

export default function MouseTrackingLayout({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = React.useState<Position>({
    x: typeof window !== "undefined" ? window?.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window?.innerHeight / 2 : 0,
  });

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = event;
    setPosition({ x: clientX, y: clientY });
  };

  return (
    <div onMouseMove={onMouseMove} className="relative overflow-hidden">
      <Mouse r={4} x={position.x} y={position.y} blur={false} />
      {children}
    </div>
  );
}
