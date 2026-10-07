"use client";

import React from "react";
import Mouse from "./mouse";

interface Position {
  x: number;
  y: number;
}

export default function MouseTrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<Position>({
    x: typeof window === "undefined" ? 0 : window.innerWidth / 2,
    y: typeof window === "undefined" ? 0 : window.innerHeight / 2,
  });

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const onMouseMove = (event: MouseEvent) => {
      const { pageX, pageY } = event;
      setPosition({ x: pageX, y: pageY });
    };

    container.addEventListener("mousemove", onMouseMove);
    return () => container.removeEventListener("mousemove", onMouseMove);
  }, []);

  return (
    <div className="relative overflow-hidden" ref={containerRef}>
      <Mouse blur={false} className="" r={4} x={position.x} y={position.y} />
      {children}
    </div>
  );
}
