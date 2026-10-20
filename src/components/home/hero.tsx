import { Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

/**
 * Landing hero. The one job of this block is to answer "when and where
 * can I come?" above the fold, with the wordmark as the visual thesis.
 * The two drifting orbs are pure CSS and only move when the visitor
 * has not asked for reduced motion.
 */
export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-dvh flex-col items-center justify-center px-4 pt-24 pb-16 text-center text-foreground sm:px-6"
      id="hero"
    >
      <p className="enter type-eyebrow text-muted-foreground">Since 1990</p>

      <h1 className="enter type-display mt-3" id="hero-title">
        Perki Aachen
      </h1>

      <p className="enter type-lead mt-5 max-w-md text-balance text-muted-foreground sm:max-w-xl">
        We’re an Indonesian Christian fellowship in Aachen. Every Saturday, we
        gather to worship, study the Word and share a meal. Come as you are.
      </p>

      <p className="enter type-body-sm sm:type-body mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <span className="inline-flex items-center gap-2">
          <Clock3 aria-hidden="true" className="size-4 text-muted-foreground" />
          Saturdays from 15:30
        </span>
        <span
          aria-hidden="true"
          className="hidden text-muted-foreground sm:inline"
        >
          ·
        </span>
        <span className="inline-flex items-center gap-2">
          <MapPin aria-hidden="true" className="size-4 text-muted-foreground" />
          Roermonderstraße 110, Aachen
        </span>
      </p>

      <Link
        className={cn(buttonVariants({ size: "lg" }), "enter mt-8")}
        href="#visit"
      >
        Plan your visit
      </Link>
    </section>
  );
}
