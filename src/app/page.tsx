import "~/styles/landing.css";

import AboutUs from "~/components/home/about-us";
import Footer from "~/components/home/footer";
import Hero from "~/components/home/hero";
import Navigation from "~/components/home/navigation";
import OurPastors from "~/components/home/our-pastors";
import VisitUs from "~/components/home/visit-us";
import WhatWeDo from "~/components/home/what-we-do";
import { api } from "~/trpc/server";

export default async function Home() {
  // Speakers are managed in the workspace, so the page renders per request.
  // The home page must never fail on them: without the table (a deploy before
  // its migration, or e2e before setup) it renders without "Our pastors".
  const pastors = await api.speakers.active().catch(() => []);
  return (
    <>
      <Navigation revealAfter="hero" />
      <main id="main-content">
        {/* Hero and About share one dark canvas so the orbs drift across both. */}
        <div className="relative isolate overflow-hidden bg-background">
          <div
            aria-hidden="true"
            className="hero-atmosphere pointer-events-none absolute inset-0 -z-10"
          >
            <div className="hero-orb hero-orb-a" />
            <div className="hero-orb hero-orb-b" />
          </div>
          <Hero />
          <AboutUs />
        </div>
        <WhatWeDo />
        <OurPastors pastors={pastors} />
        <VisitUs />
      </main>
      <Footer />
    </>
  );
}
