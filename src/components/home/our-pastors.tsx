"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { pastors } from "~/lib/data";
import { cn } from "~/lib/utils";
import Section from "./section";

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const paragraphs = (story: string | React.ReactNode) =>
  typeof story === "string"
    ? story
        .split("\n")
        .map((part) => part.trim())
        .filter(Boolean)
    : [story];

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PORTRAIT_MIN_SCALE = 0.7;
const PORTRAIT_MIN_OPACITY = 0.5;
const SCROLL_SETTLE_DELAY = 150;

const updatePortrait = (
  element: HTMLElement,
  proximity: number,
  reduce: boolean
) => {
  const portrait = element.querySelector("img");
  if (!portrait) {
    return;
  }
  const scale = reduce
    ? 1
    : PORTRAIT_MIN_SCALE + (1 - PORTRAIT_MIN_SCALE) * proximity;
  portrait.style.transform = `scale(${scale})`;
  portrait.style.opacity = String(
    PORTRAIT_MIN_OPACITY + (1 - PORTRAIT_MIN_OPACITY) * proximity
  );
};

function Story({ story }: { readonly story: string | React.ReactNode }) {
  return (
    <div className="type-body max-w-prose space-y-4">
      {paragraphs(story).map((part, index) =>
        typeof part === "string" ? (
          <p key={part}>{part}</p>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: a single JSX node has no stable key
          <div key={index}>{part}</div>
        )
      )}
    </div>
  );
}

/**
 * Phone layout: a centred gallery of portraits. The one in the middle
 * is large, its neighbours peek in smaller at the sides, arrows or a
 * swipe move between them, and the story opens only on request.
 */
function PastorGallery() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [destination, setDestination] = useState(0);
  const destinationRef = useRef(0);
  const navigatingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const storyId = useId();
  const current = pastors.at(active);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    let frame = 0;
    let settleTimer: ReturnType<typeof setTimeout>;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePortraits = (followGesture: boolean) => {
      if (track.clientWidth === 0) {
        return 0;
      }
      const center = track.scrollLeft + track.clientWidth / 2;
      let nearest = 0;
      let distance = Number.POSITIVE_INFINITY;
      for (const [index, item] of Array.from(track.children).entries()) {
        const element = item as HTMLElement;
        const itemCenter = element.offsetLeft + element.offsetWidth / 2;
        const gap = Math.abs(itemCenter - center);
        const next = element.nextElementSibling as HTMLElement | null;
        const step = next
          ? next.offsetLeft - element.offsetLeft
          : element.offsetWidth;
        const proximity = Math.max(0, 1 - gap / step);
        updatePortrait(element, proximity, motion.matches);
        if (gap < distance) {
          distance = gap;
          nearest = index;
        }
      }
      setActive(nearest);
      if (followGesture) {
        destinationRef.current = nearest;
        setDestination(nearest);
      }
      return nearest;
    };
    const onSettle = () => {
      navigatingRef.current = false;
      updatePortraits(true);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        updatePortraits(!navigatingRef.current);
      });
      clearTimeout(settleTimer);
      settleTimer = setTimeout(onSettle, SCROLL_SETTLE_DELAY);
    };
    updatePortraits(true);
    const resize = new ResizeObserver(onSettle);
    resize.observe(track);
    motion.addEventListener("change", onSettle);
    track.addEventListener("pointerdown", onSettle, { passive: true });
    track.addEventListener("wheel", onSettle, { passive: true });
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
      resize.disconnect();
      motion.removeEventListener("change", onSettle);
      track.removeEventListener("pointerdown", onSettle);
      track.removeEventListener("wheel", onSettle);
      track.removeEventListener("scroll", onScroll);
    };
  }, []);

  const goTo = (index: number, animate: boolean) => {
    const track = trackRef.current;
    const item = track?.children.item(index) as HTMLElement | null;
    if (!(track && item)) {
      return;
    }
    destinationRef.current = index;
    navigatingRef.current = true;
    setDestination(index);
    track.scrollTo({
      behavior: animate && !prefersReducedMotion() ? "smooth" : "instant",
      left: item.offsetLeft + item.offsetWidth / 2 - track.clientWidth / 2,
    });
  };

  if (!current) {
    return null;
  }

  return (
    <div className="lg:hidden">
      <div className="relative">
        <ul
          className="relative flex snap-x snap-mandatory gap-2 overflow-x-auto px-[calc(50%-4.5rem)] py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={trackRef}
        >
          {pastors.map((pastor, index) => (
            <li className="w-36 shrink-0 snap-center" key={pastor.name}>
              <button
                aria-label={pastor.name}
                aria-pressed={index === active}
                className="flex w-full justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={(event) => goTo(index, event.detail > 0)}
                type="button"
              >
                <Image
                  alt=""
                  className="size-32 rounded-full object-cover object-top"
                  height={256}
                  sizes="8rem"
                  src={pastor.img}
                  style={{
                    opacity: index === 0 ? 1 : PORTRAIT_MIN_OPACITY,
                    transform: `scale(${index === 0 ? 1 : PORTRAIT_MIN_SCALE})`,
                  }}
                  width={256}
                />
              </button>
            </li>
          ))}
        </ul>

        <Button
          aria-label="Previous pastor"
          className="absolute top-1/2 left-0 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur"
          disabled={destination === 0}
          onClick={(event) =>
            goTo(destinationRef.current - 1, event.detail > 0)
          }
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Button>
        <Button
          aria-label="Next pastor"
          className="absolute top-1/2 right-0 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur"
          disabled={destination === pastors.length - 1}
          onClick={(event) =>
            goTo(destinationRef.current + 1, event.detail > 0)
          }
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </Button>
      </div>

      <div className="mt-4 text-center">
        <div className="grid">
          {pastors.map((pastor, index) => (
            <div
              aria-hidden={index !== active}
              className={cn("[grid-area:1/1]", index !== active && "invisible")}
              key={pastor.name}
            >
              <h3 className="type-heading">{pastor.name}</h3>
              <p className="type-quote mx-auto mt-2 max-w-sm text-balance text-muted-foreground">
                “{pastor.favoriteVerse}”
              </p>
            </div>
          ))}
        </div>
        <Button
          aria-controls={storyId}
          aria-expanded={open}
          className="mt-4"
          onClick={() => setOpen((value) => !value)}
          size="sm"
          type="button"
          variant="secondary"
        >
          {open ? "Hide story" : "Read story"}
          <ChevronDown
            aria-hidden="true"
            className={cn("size-4 transition-transform", open && "rotate-180")}
          />
        </Button>
      </div>

      {open ? (
        <div className="mt-4 rounded-xl bg-card p-4 text-left" id={storyId}>
          <Story story={current.story} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Desktop layout: portraits as tabs, the selected pastor's verse and
 * story beside them. Every panel stays mounted and stacked in one grid
 * cell, so the block keeps one height and nothing jumps on switch.
 */
function PastorTabs() {
  const first = pastors.at(0);
  if (!first) {
    return null;
  }

  return (
    <Tabs
      className="hidden gap-10 lg:grid lg:grid-cols-[15rem_1fr]"
      defaultValue={slug(first.name)}
      orientation="vertical"
    >
      <TabsList
        aria-label="Pastors"
        className="flex h-auto flex-col items-stretch justify-start gap-2 rounded-none bg-transparent p-0 text-foreground"
      >
        {pastors.map((pastor) => (
          <TabsTrigger
            className="flex items-center justify-start gap-3 whitespace-normal rounded-xl px-4 py-3 text-left transition-colors hover:bg-card data-[state=active]:bg-card data-[state=active]:shadow-none"
            key={pastor.name}
            value={slug(pastor.name)}
          >
            <Image
              alt=""
              className="size-14 shrink-0 rounded-full object-cover object-top"
              height={112}
              sizes="3.5rem"
              src={pastor.img}
              width={112}
            />
            <span className="type-subheading text-balance">{pastor.name}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="grid [&>*]:[grid-area:1/1]">
        {pastors.map((pastor) => (
          <TabsContent
            className="mt-0 rounded-xl bg-card p-6 data-[state=inactive]:invisible"
            forceMount
            key={pastor.name}
            value={slug(pastor.name)}
          >
            <div className="flex items-center gap-6">
              <Image
                alt={`Portrait of ${pastor.name}`}
                className="size-28 shrink-0 rounded-full object-cover object-top"
                height={224}
                sizes="7rem"
                src={pastor.img}
                width={224}
              />
              <div className="min-w-0">
                <h3 className="type-heading">{pastor.name}</h3>
                <p className="type-quote mt-1 text-balance text-muted-foreground">
                  “{pastor.favoriteVerse}”
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Story story={pastor.story} />
            </div>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

export default function OurPastors() {
  return (
    <Section eyebrow="Who serves us" id="pastors" title="Our pastors">
      <PastorGallery />
      <PastorTabs />
    </Section>
  );
}
