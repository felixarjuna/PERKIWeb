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
      className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 pt-24 pb-16 text-center text-foreground sm:px-6"
      id="hero"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="hero-orb hero-orb-a" />
        <div className="hero-orb hero-orb-b" />
      </div>

      <p className="text-muted-foreground text-xs uppercase tracking-[0.12em] sm:text-sm">
        <span>Indonesian Christian fellowship</span>
        <br className="sm:hidden" />
        <span className="hidden sm:inline"> · </span>
        <span>Aachen · since 1990</span>
      </p>

      <h1
        className="mt-3 font-reimbrandt text-[clamp(3.25rem,14vw,10rem)] leading-[0.95] tracking-wide"
        id="hero-title"
      >
        Perki Aachen
      </h1>

      <p className="mt-5 max-w-md text-balance text-base text-muted-foreground sm:max-w-xl sm:text-xl">
        A non-denominational fellowship that gathers every week to worship,
        study the Word and share a meal. Come as you are.
      </p>

      <p className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm sm:text-base">
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
        className={cn(buttonVariants({ size: "lg" }), "mt-8 w-full sm:w-auto")}
        href="#visit"
      >
        Plan your visit
      </Link>
    </section>
  );
}
