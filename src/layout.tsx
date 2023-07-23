import React from "react";
import { Mouse } from "./components/ui/mouse";

type Position = {
  x: number;
  y: number;
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [position, setPosition] = React.useState<Position>({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
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
};
