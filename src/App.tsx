import AboutUs from "./components/about-us";
import { Footer } from "./components/footer";
import Home from "./components/homepage";
import OurPastors from "./components/our-pastors";
import WhatWeDo from "./components/what-we-do";
import WhereAreWe from "./components/where-are-we";
import "./index.css";
import { Layout } from "./layout";

function App() {
  return (
    <Layout>
      <Home />
      <AboutUs />
      <WhatWeDo />
      <OurPastors />
      <WhereAreWe />
      <Footer />
    </Layout>
  );
}

export default App;
