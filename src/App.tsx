import React from "react";
import AboutUs from "./components/aboutus";
import Home from "./components/homepage";
import { Mouse } from "./components/ui/mouse";
import "./index.css";

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
    </div>
  );
}

export default App;
