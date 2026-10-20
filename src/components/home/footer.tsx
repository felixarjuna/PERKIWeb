import { InstagramLogoIcon } from "@radix-ui/react-icons";
import { Mail, Phone } from "lucide-react";
import Link from "next/link";

const siteLinks = [
  { href: "/schedule", label: "Schedule" },
  { href: "/takeaway", label: "Takeaway" },
  { href: "/prayers", label: "Weekly prayer" },
  { href: "/member/join", label: "Become a member" },
] as const;

const legalLinks = [
  { href: "/legal-notice", label: "Legal notice" },
  { href: "/privacy", label: "Privacy policy" },
] as const;

const linkClass =
  "rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function Footer() {
  return (
    <footer className="relative -mt-8 rounded-t-[2.5rem] bg-background pt-4 text-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:grid-cols-3 sm:px-6 sm:py-20">
        <div>
          <p className="font-reimbrandt text-2xl tracking-wide">Perki Aachen</p>
          <p className="mt-2 max-w-xs text-muted-foreground text-sm">
            Persekutuan Kristen Indonesia Aachen. An Indonesian Christian
            fellowship, meeting since 1990.
          </p>
        </div>

        <nav aria-label="Site">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
            Pages
          </p>
          <ul className="mt-3 space-y-2 text-sm sm:text-base">
            {siteLinks.map((link) => (
              <li key={link.href}>
                <Link className={linkClass} href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
            Contact
          </p>
          <ul className="mt-3 space-y-2 text-sm sm:text-base">
            <li className="flex items-center gap-2">
              <Mail aria-hidden="true" className="size-4 shrink-0" />
              <a className={linkClass} href="mailto:perkiaachen18@gmail.com">
                perkiaachen18@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone aria-hidden="true" className="size-4 shrink-0" />
              <a
                className={`${linkClass} tabular-nums`}
                href="tel:+491745277265"
              >
                +49 174 5277265
              </a>
            </li>
            <li className="flex items-center gap-2">
              <InstagramLogoIcon
                aria-hidden="true"
                className="size-4 shrink-0"
              />
              <a
                className={linkClass}
                href="https://www.instagram.com/perki.aachen/"
                rel="noopener noreferrer"
                target="_blank"
              >
                @perki.aachen
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 pb-8 text-muted-foreground text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} PERKI Aachen</p>
        <ul className="flex gap-4">
          {legalLinks.map((link) => (
            <li key={link.href}>
              <Link className={linkClass} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
