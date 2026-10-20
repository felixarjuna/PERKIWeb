import type React from "react";
import { cn } from "~/lib/utils";
import Reveal from "./reveal";

interface SectionProps {
  readonly children: React.ReactNode;
  readonly eyebrow?: string;
  readonly id: string;
  /** Lift this section over the previous one with a rounded top edge. */
  readonly overlap?: boolean;
  readonly title: string;
  readonly tone?: "background" | "paper" | "transparent";
}

/**
 * Landing-page section shell. The signature of the page is the vertical
 * section title: on large screens it runs bottom-to-top in a sticky
 * column, clipped to its own section so it never bleeds into the next.
 * Sections alternate dark and cream; each one slides over the previous
 * like a sheet, so the hand-off between them reads as intended.
 */
export default function Section({
  children,
  eyebrow,
  id,
  overlap = false,
  title,
  tone = "background",
}: SectionProps) {
  const headingId = `${id}-title`;
  const onPaper = tone === "paper";

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "scroll-mt-20 py-16 sm:py-24",
        onPaper && "bg-paper text-paper-foreground",
        tone === "background" && "bg-background text-foreground",
        tone === "transparent" && "text-foreground",
        overlap && "relative -mt-8 rounded-t-[2.5rem] pt-20 sm:pt-28"
      )}
      id={id}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[7rem_1fr] lg:gap-12">
        <Reveal className="lg:sticky lg:top-24 lg:flex lg:flex-col lg:items-start lg:self-start">
          {eyebrow ? (
            <p
              className={cn(
                "text-xs uppercase tracking-[0.2em] lg:mb-4 lg:rotate-180 lg:[writing-mode:vertical-rl]",
                onPaper ? "text-paper-foreground" : "text-muted-foreground"
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <h2
            className="font-reimbrandt text-3xl tracking-wide sm:text-4xl lg:rotate-180 lg:whitespace-nowrap lg:text-6xl lg:[writing-mode:vertical-rl]"
            id={headingId}
          >
            {title}
          </h2>
        </Reveal>

        <Reveal className="min-w-0" delay={80}>
          {children}
        </Reveal>
      </div>
    </section>
  );
}
