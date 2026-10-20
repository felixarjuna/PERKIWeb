import "~/styles/landing.css";

import AboutUs from "~/components/home/about-us";
import Footer from "~/components/home/footer";
import Hero from "~/components/home/hero";
import Navigation from "~/components/home/navigation";
import OurPastors from "~/components/home/our-pastors";
import VisitUs from "~/components/home/visit-us";
import WhatWeDo from "~/components/home/what-we-do";

export default function Home() {
  return (
    <>
      <Navigation revealAfter="hero" />
      <main>
        {/* Hero and About share one dark canvas so the orbs drift across both. */}
        <div className="relative isolate overflow-hidden bg-background">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="hero-orb hero-orb-a" />
            <div className="hero-orb hero-orb-b" />
          </div>
          <Hero />
          <AboutUs />
        </div>
        <WhatWeDo />
        <OurPastors />
        <VisitUs />
      </main>
      <Footer />
    </>
  );
}
