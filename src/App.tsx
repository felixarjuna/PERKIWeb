import AboutUs from "./components/about-us";
import { Footer } from "./components/footer";
import Home from "./components/homepage";
import OurPastors from "./components/our-pastors";
import WhatWeDo from "./components/what-we-do";
import "./index.css";
import { Layout } from "./layout";

function App() {
  return (
    <Layout>
      <Home />
      <AboutUs />
      <WhatWeDo />
      <OurPastors />
      <Footer />
    </Layout>
  );
}

export default App;
