import React from "react";

/**
 * Observes an element and returns its latest IntersectionObserverEntry.
 */
export const useIntersection = (
  ref: React.RefObject<HTMLElement | null>,
  options: IntersectionObserverInit,
): IntersectionObserverEntry | null => {
  const [entry, setEntry] = React.useState<IntersectionObserverEntry | null>(
    null,
  );
  const { root, rootMargin, threshold } = options;

  React.useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => setEntry(entries.at(-1) ?? null),
      { root, rootMargin, threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, root, rootMargin, threshold]);

  return entry;
};
