import AboutUs from "~/components/home/about-us";
import Footer from "~/components/home/footer";
import Hero from "~/components/home/hero";
import MemberBanner from "~/components/home/member-banner";
import Navigation from "~/components/home/navigation";
import OurPastors from "~/components/home/our-pastors";
import VisitUs from "~/components/home/visit-us";
import WhatWeDo from "~/components/home/what-we-do";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <AboutUs />
        <WhatWeDo />
        <OurPastors />
        <VisitUs />
      </main>
      <Footer />
      <MemberBanner />
    </>
  );
}
