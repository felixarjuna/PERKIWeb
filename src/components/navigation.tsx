"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

interface NavigationProps {
  showNav: boolean;
}

const navigations = [
  {
    icon: "🙏",
    name: "Prayer",
    href: "/prayers",
  },
  {
    icon: "📅",
    name: "Schedule",
    href: "/schedule",
  },
  {
    icon: "🧠",
    name: "Takeaway",
    href: "/takeaway",
  },
];

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
          className="fixed left-0 right-0 top-10 isolate z-50 mx-auto flex h-fit w-fit items-center gap-6 rounded-lg bg-green-default/40 px-8 py-4 text-xl text-cream-default xs:mx-auto xs:max-w-[18rem] xs:gap-1 xs:gap-x-3 xs:py-3 xs:text-xs"
        >
          <Link
            href={"/"}
            className="text-center font-reimbrandt text-2xl xs:my-auto xs:mr-2 xs:text-base"
          >
            Perki Aachen
          </Link>
          {navigations.map((nav, index) => {
            return (
              <Link
                key={index}
                href={nav.href}
                className="flex cursor-pointer items-center gap-2 xs:flex-col xs:gap-1"
              >
                <span className="flex items-center justify-center rounded-lg bg-gradient-to-r from-light-green-default/50 to-green-default p-[2px] xs:h-6 xs:w-6 xs:p-[1px]">
                  {nav.icon}
                </span>
                <p>{nav.name}</p>
              </Link>
            );
          })}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
