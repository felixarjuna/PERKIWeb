"use client";

import { useEffect, useRef } from "react";
import { cn } from "~/lib/utils";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
  /** Delay step in ms, for staggering siblings. */
  readonly delay?: number;
}

/**
 * Reveals its content once, the first time it scrolls into view.
 * Pure CSS does the motion (see `.reveal` in globals.css); this only
 * flips a data attribute. Fires once, so the page never fights the
 * reader on the way back up.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  style,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          element.dataset.visible = "";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn("reveal", className)}
      ref={ref}
      style={{ ...style, transitionDelay: delay ? `${delay}ms` : undefined }}
      {...props}
    >
      {children}
    </div>
  );
}
