"use client";

import { Calendar, HandHeart, House, NotebookPen, User } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

const navigations = [
  { href: "/", icon: House, name: "Home" },
  { href: "/schedule", icon: Calendar, name: "Schedule" },
  { href: "/takeaway", icon: NotebookPen, name: "Takeaway" },
  { href: "/prayers", icon: HandHeart, name: "Prayer" },
] as const;

const itemClass =
  "group type-caption flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-lg px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-14 sm:px-2";
const tileClass =
  "flex size-8 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-primary group-hover:text-primary-foreground";

interface NavigationProps {
  /**
   * Id of the element the bar should stay hidden behind. The bar appears
   * once that element has scrolled out of view (landing page hero).
   * Omit to show the bar immediately.
   */
  readonly revealAfter?: string;
}

/**
 * Floating pill navigation. On the landing page it slides in after the
 * hero; on app pages it is always there. Labels are visually hidden on
 * phones but stay in the accessible name.
 */
export default function Navigation({ revealAfter }: NavigationProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(!revealAfter);

  useEffect(() => {
    if (!revealAfter) {
      return;
    }
    const target = document.getElementById(revealAfter);
    if (!target) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry ? !entry.isIntersecting : true),
      { rootMargin: "-80px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [revealAfter]);

  return (
    <AnimatePresence initial={Boolean(revealAfter)}>
      {visible ? (
        <motion.nav
          animate={{ opacity: 1, y: 0 }}
          aria-label="Primary"
          className="fixed top-4 left-1/2 z-40 -translate-x-1/2 sm:top-6"
          exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
          initial={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
          key="navigation"
          transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
        >
          <ul className="flex items-center gap-1 rounded-2xl bg-accent/80 px-2 py-1.5 text-foreground shadow-lg backdrop-blur sm:gap-2 sm:px-3 sm:py-2">
            {navigations.map(({ href, icon: Icon, name }) => {
              const current = pathname === href;
              return (
                <li key={href}>
                  <Link
                    aria-current={current ? "page" : undefined}
                    className={itemClass}
                    href={href}
                  >
                    <span
                      className={cn(
                        tileClass,
                        current && "bg-primary text-primary-foreground"
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="sr-only sm:not-sr-only">{name}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                className={itemClass}
                onClick={
                  session ? () => router.push("/account") : () => signIn()
                }
                type="button"
              >
                <span className={tileClass}>
                  <User aria-hidden="true" className="size-4" />
                </span>
                <span className="sr-only sm:not-sr-only">
                  {session ? "Account" : "Sign in"}
                </span>
              </button>
            </li>
          </ul>
        </motion.nav>
      ) : null}
    </AnimatePresence>
  );
}
