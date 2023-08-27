"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

interface NavigationProps {
  showNav: boolean;
}

export default function Navigation({ showNav }: NavigationProps) {
  return (
    <AnimatePresence>
      {showNav ? (
        <motion.div
          key="navigation"
          initial={{ opacity: 0 }}
          animate={{
            y: [0, 20, 0],
            opacity: 1,
            transition: {
              y: { ease: [0.6, 0.01, -0.05, 0.95], duration: 0.8 },
            },
          }}
          exit={{ opacity: 0, y: [0, 20, 0], transition: { duration: 0.5 } }}
          className="fixed isolate top-10 left-0 right-0 mx-auto bg-green-default/40 w-fit h-fit text-cream-default text-xl px-8 py-4 rounded-lg flex gap-6 z-50 xs:mx-4 xs:text-xs xs:gap-1 xs:px-4 xs:py-3"
        >
          <Link href={"/"} className="font-reimbrandt text-2xl xs:text-sm xs:mr-2">
            Perki Aachen
          </Link>
          <Link href="/prayers" className="flex gap-2 cursor-pointer items-center xs:gap-1">
            <span className="bg-gradient-to-r from-light-green-default/50 to-green-default rounded-lg p-[2px] xs:p-[1px] xs:w-5 xs:h-5 flex items-center justify-center">
              🙏
            </span>
            <p>Prayers</p>
          </Link>
          <Link href="/schedule" className="flex gap-2 cursor-pointer items-center xs:gap-1">
            <span className="bg-gradient-to-r from-light-green-default/50 to-green-default rounded-lg p-[2px] xs:p-[1px] xs:w-5 xs:h-5 flex items-center justify-center">
              📅
            </span>
            <p>Schedule</p>
          </Link>
          <Link href="/takeaway" className="flex gap-2 cursor-pointer items-center xs:gap-1">
            <span className="bg-gradient-to-r from-light-green-default/50 to-green-default rounded-lg p-[2px] xs:p-[1px] xs:w-5 xs:h-5 flex items-center justify-center">
              🧠
            </span>
            <p>Takeaways</p>
          </Link>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
