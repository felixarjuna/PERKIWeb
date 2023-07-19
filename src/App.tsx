<<<<<<< HEAD
import './index.css';
import Home from "./components/homepage";
import AboutUs from "./components/about-us";
import WhatWeDo from "./components/what-we-do";
=======
import React from "react";
import AboutUs from "./components/aboutus";
import Home from "./components/homepage";
import { Mouse } from "./components/ui/mouse";
import "./index.css";
>>>>>>> e3469abcd1f2f1b48dd06322bcea23f673d41db1

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
<<<<<<< HEAD
      <WhatWeDo />
    </>
=======
    </div>
>>>>>>> e3469abcd1f2f1b48dd06322bcea23f673d41db1
  );
}

export default App;
