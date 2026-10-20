"use client";

import { Calendar, HandHeart, House, NotebookPen, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { cn } from "~/lib/utils";

const navigations = [
  { href: "/", icon: House, name: "Home" },
  { href: "/schedule", icon: Calendar, name: "Schedule" },
  { href: "/takeaway", icon: NotebookPen, name: "Takeaway" },
  { href: "/prayers", icon: HandHeart, name: "Prayer" },
] as const;

const itemClass =
  "flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3";

/**
 * Site header. Fixed, translucent, always visible. Labels are visually
 * hidden below `sm` but stay in the accessible name, so icon-only links
 * on phones are still announced and still match in tests.
 */
export default function Navigation() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-background/80 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          className="rounded-sm font-reimbrandt text-xl tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/"
        >
          Perki Aachen
        </Link>

        <nav aria-label="Primary">
          <ul className="flex items-center gap-1">
            {navigations.map(({ href, icon: Icon, name }) => (
              <li key={href}>
                <Link
                  aria-current={pathname === href ? "page" : undefined}
                  className={cn(
                    itemClass,
                    pathname === href && "bg-accent/60 text-accent-foreground"
                  )}
                  href={href}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  <span className="sr-only sm:not-sr-only">{name}</span>
                </Link>
              </li>
            ))}
            <li>
              <button
                className={itemClass}
                onClick={
                  session ? () => router.push("/account") : () => signIn()
                }
                type="button"
              >
                <User aria-hidden="true" className="size-4" />
                <span className="sr-only sm:not-sr-only">
                  {session ? "Account" : "Sign in"}
                </span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
