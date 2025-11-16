import Link from "next/link";
import React from "react";
import CircleBackground from "~/components/circle-background";
import AboutUs from "~/components/home/about-us";
import Footer from "~/components/home/footer";
import OurPastors from "~/components/home/our-pastors";
import Welcome from "~/components/home/welcome";
import WhatWeDo from "~/components/home/what-we-do";
import WhereAreWe from "~/components/home/where-are-we";
import { buttonVariants } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

export default function Home() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      <Dialog defaultOpen={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-bold font-mono text-xl">
              🎄 CHRISTMAS IS COMING ...
            </DialogTitle>
            <DialogDescription className="pt-4">
              Our christmas celebration is around the corner. Register yourself
              before anyone else to secure your spot to not miss anything! ❄️
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-center">
            <Link
              className={cn(
                buttonVariants({ variant: "default" }),
                "flex w-fit items-center justify-center"
              )}
              href={"/christmas"}
            >
              Register Now
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative inset-0 z-10">
        <CircleBackground
          blur
          className={
            "bg-gradient-to-r from-green-100 via-light-green-100 to-light-green-default mix-blend-lighten"
          }
          r={isMobile ? 60 : 100}
        />
        <CircleBackground
          blur
          className={
            "bg-gradient-to-r from-green-100 via-light-green-100 to-light-green-default mix-blend-multiply"
          }
          duration={25}
          r={isMobile ? 60 : 100}
          reverse
        />
      </div>

      <Welcome />
      <AboutUs />
      <WhatWeDo />
      <OurPastors />
      <WhereAreWe />
      <Footer />
    </div>
  );
}
