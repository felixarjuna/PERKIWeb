"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Calendar, HandHeart, House, NotebookPen, User } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const navigations = [
  {
    icon: <House className="h-4 w-4" />,
    name: "Home",
    href: "/",
  },
  {
    icon: <Calendar className="h-4 w-4" />,
    name: "Schedule",
    href: "/schedule",
  },
  {
    icon: <NotebookPen className="h-4 w-4" />,
    name: "Takeaway",
    href: "/takeaway",
  },
  {
    icon: <HandHeart className="h-4 w-4" />,
    name: "Prayer",
    href: "/prayers",
  },
];

interface INavigationProps {
  readonly showNav: boolean;
}

export default function Navigation({ showNav }: INavigationProps) {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <AnimatePresence>
      <div className="text-lg xs:text-xs">
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
            className="fixed left-0 right-0 top-10 isolate z-50 mx-auto flex w-fit items-center justify-center space-x-2 rounded-lg bg-green-default/80 px-8 py-4 text-cream-default xs:max-w-xs xs:gap-1 xs:gap-x-3 xs:px-4 xs:py-3"
          >
            {navigations.map((nav, index) => {
              return (
                <Link
                  key={index}
                  href={nav.href}
                  className="flex cursor-pointer items-center gap-2 xs:flex-col xs:gap-1"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-light-green-default/50 to-green-default p-[2px] xs:h-6 xs:w-6 xs:p-[1px]">
                    {nav.icon}
                  </div>
                  <p className="lowercase">{nav.name}</p>
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
              <p className="lowercase">{session ? "Account" : "Sign in"}</p>
            </div>
          </motion.div>
        ) : null}
      </div>
    </AnimatePresence>
  );
}
