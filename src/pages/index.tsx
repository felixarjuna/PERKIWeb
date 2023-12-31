import AboutUs from "~/components/about-us";
import Footer from "~/components/footer";
import OurPastors from "~/components/our-pastors";
import Welcome from "~/components/welcome";
import WhatWeDo from "~/components/what-we-do";
import WhereAreWe from "~/components/where-are-we";

export default function Home() {
  return (
    <>
      <Welcome />
      <AboutUs />
      <WhatWeDo />
      <OurPastors />
      <WhereAreWe />
      <Footer />
    </>
  );
}
