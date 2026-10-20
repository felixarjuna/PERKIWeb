"use client";

import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

const TICKS = 28;
const ticks = Array.from({ length: TICKS }, (_, index) => index);

interface Viewport {
  /** Fraction of the page the viewport covers, 0..1. */
  size: number;
  /** Fraction of the page above the viewport, 0..1. */
  start: number;
}

const readWindow = (): Viewport | null => {
  const total = document.documentElement.scrollHeight;
  const visible = window.innerHeight;
  if (total <= visible) {
    return null;
  }
  return { size: visible / total, start: window.scrollY / total };
};

/**
 * Ruler-style scroll indicator that replaces the native scrollbar on
 * pointer devices: a column of ticks on the right edge, with the ticks
 * for the part of the page currently on screen drawn longer and
 * brighter. Clicking a tick scrolls there. Decorative for assistive
 * tech; keyboard users scroll as usual.
 */
export default function ScrollRuler() {
  const [view, setView] = useState<Viewport | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setView(readWindow()));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, []);

  if (!view) {
    return null;
  }

  const jump = (index: number) => {
    const total = document.documentElement.scrollHeight;
    const target = (index / TICKS) * total - window.innerHeight / 2;
    window.scrollTo({ behavior: "smooth", top: Math.max(0, target) });
  };

  return (
    <div
      aria-hidden="true"
      className="fixed top-1/2 right-3 z-30 hidden -translate-y-1/2 flex-col items-end gap-2 mix-blend-difference md:flex"
    >
      {ticks.map((index) => {
        const at = index / TICKS;
        const active = at >= view.start && at < view.start + view.size;
        return (
          <button
            className="group flex h-1 w-6 cursor-pointer items-center justify-end"
            key={index}
            onClick={() => jump(index)}
            tabIndex={-1}
            type="button"
          >
            <span
              className={cn(
                "block h-px origin-right bg-foreground transition-[transform,opacity] duration-150 ease-out group-hover:opacity-100",
                active ? "w-5 opacity-100" : "w-3 opacity-40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
