"use client";

import { AnimatePresence, motion } from "framer-motion";
import { User } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const { data: session } = useSession();
  const router = useRouter();

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
          className="fixed left-0 right-0 top-10 isolate z-50 mx-auto flex h-fit w-fit items-center gap-6 rounded-lg bg-green-default/40 px-8 py-4 text-xl text-cream-default xs:gap-1 xs:gap-x-3 xs:px-4 xs:py-3 xs:text-xs"
        >
          <Link
            href={"/"}
            className="text-center font-reimbrandt text-2xl xs:my-auto xs:w-20 xs:text-base"
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
          <div
            className="flex w-fit cursor-pointer items-center gap-2 xs:flex-col xs:gap-1"
            onClick={
              session ? () => router.push("/account") : () => void signIn()
            }
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-light-green-default/50 to-green-default p-[2px] xl:h-8 xl:w-8 2xl:h-8 2xl:w-8 xs:h-6 xs:w-6 xs:p-[1px]">
              <User className="h-4 w-4" />
            </span>
            {session ? "Account" : "Sign in"}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
