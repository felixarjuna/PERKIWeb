import React from "react";
import './index.css';
import Home from "./components/homepage";
import AboutUs from "./components/about-us";
import WhatWeDo from "./components/what-we-do";
import { Mouse } from "./components/ui/mouse";

type Position = {
  x: number;
  y: number;
};
function App() {
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
      <Home />
      <AboutUs />
      <WhatWeDo />
    </div>
  );
}

export default App;
