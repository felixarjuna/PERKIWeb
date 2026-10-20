import { CalendarDays, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const facts = [
  { icon: Clock3, label: "Saturdays from 15:30" },
  { icon: MapPin, label: "Roermonderstraße 110, Aachen" },
] as const;

/**
 * Landing hero. The one job of this block is to answer "when and where
 * can I come?" above the fold, with the wordmark as the visual thesis.
 */
export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 pt-24 pb-16 text-center text-foreground sm:px-6"
    >
      <div
        aria-hidden="true"
        className="hero-glow pointer-events-none absolute inset-0 -z-10"
      />

      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] sm:text-sm">
        Indonesian Christian fellowship in Aachen · since 1990
      </p>

      <h1
        className="mt-4 font-reimbrandt text-[clamp(3.25rem,14vw,10rem)] leading-[0.95] tracking-wide"
        id="hero-title"
      >
        Perki Aachen
      </h1>

      <p className="mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-xl">
        A non-denominational fellowship that gathers every week to worship,
        study the Word and share a meal. Come as you are.
      </p>

      <ul className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {facts.map(({ icon: Icon, label }) => (
          <li
            className="flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-paper-foreground text-xs sm:text-sm"
            key={label}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link
          className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
          href="#visit"
        >
          <MapPin aria-hidden="true" className="size-4" />
          Plan your visit
        </Link>
        <Link
          className={cn(
            buttonVariants({ size: "lg", variant: "secondary" }),
            "w-full sm:w-auto"
          )}
          href="/schedule"
        >
          <CalendarDays aria-hidden="true" className="size-4" />
          See the schedule
        </Link>
      </div>
    </section>
  );
}
