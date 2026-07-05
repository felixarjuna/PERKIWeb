"use client";

import { Calendar, HandHeart, House, NotebookPen, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useIsMobile } from "~/hooks/use-mobile";

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

  const isMobile = useIsMobile();

  return (
    <AnimatePresence>
      <div className="text-xs sm:text-lg">
        {showNav ? (
          <motion.div
            animate={{
              y: [0, 20, 0],
              opacity: 1,
              transition: {
                y: { ease: [0.6, 0.01, -0.05, 0.95], duration: 0.8 },
              },
            }}
            className="fixed top-10 right-0 left-0 z-20 mx-auto flex w-10/12 flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-lg bg-accent/80 px-4 py-3 text-center text-foreground sm:max-w-5xl sm:space-x-4 sm:px-8 sm:py-4"
            exit={{ opacity: 0, y: [0, 20, 0], transition: { duration: 0.5 } }}
            initial={{ opacity: 0 }}
            key="navigation"
          >
            {navigations.map((nav, index) => (
              <div key={index}>
                <Link
                  className="flex cursor-pointer flex-col items-center gap-1 sm:gap-2"
                  href={nav.href}
                >
                  <div className="flex aspect-square items-center justify-center rounded-lg bg-gradient-to-r from-light-green-default/50 to-green-default p-1 sm:h-8 sm:w-8 sm:p-[2px]">
                    {nav.icon}
                  </div>
                  {isMobile ? null : <p>{nav.name}</p>}
                </Link>
              </div>
            ))}

            <div
              className="flex w-fit cursor-pointer flex-col items-center gap-1 sm:gap-2"
              onClick={
                session ? () => router.push("/account") : () => void signIn()
              }
            >
              <span className="flex aspect-square items-center justify-center rounded-lg bg-gradient-to-r from-light-green-default/50 to-green-default p-1 sm:h-8 sm:w-8 sm:p-[2px] xl:h-8 xl:w-8 2xl:h-8 2xl:w-8">
                <User className="h-4 w-4" />
              </span>
              {isMobile ? null : <p>{session ? "Account" : "Sign in"}</p>}
            </div>
          </motion.div>
        ) : null}
      </div>
    </AnimatePresence>
  );
}
