"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

/**
 * "Load more" under a paged list. Screen readers hear how many items are
 * shown after each load; when the last page arrives the button gives way to
 * an end note, which takes focus so keyboard users don't lose their place.
 */
export default function LoadMore({
  className,
  count,
  hasNextPage,
  loading,
  noun,
  onLoadMore,
}: {
  className?: string;
  /** Items shown so far. */
  count: number;
  hasNextPage: boolean;
  /**
   * Whether any page of the list is fetching. Fetching the next page during a
   * refresh would cancel it and append to the stale first page.
   */
  loading: boolean;
  /** Plural, e.g. "gatherings". */
  noun: string;
  onLoadMore: () => void;
}) {
  const [loadedMore, setLoadedMore] = useState(false);
  const end = useRef<HTMLParagraphElement>(null);
  const reachedEnd = loadedMore && !hasNextPage && !loading;

  useEffect(() => {
    // The button just unmounted, so focus fell back to the page.
    if (reachedEnd && document.activeElement === document.body) {
      end.current?.focus();
    }
  }, [reachedEnd]);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {hasNextPage ? (
        <Button
          // aria-disabled, not disabled: a disabled button drops focus.
          aria-disabled={loading}
          className="w-full aria-disabled:opacity-50 sm:w-auto"
          onClick={() => {
            if (loading) {
              return;
            }
            setLoadedMore(true);
            onLoadMore();
          }}
          type="button"
          variant="secondary"
        >
          {loading ? (
            <Loader2
              aria-hidden="true"
              className="size-4 motion-safe:animate-spin"
            />
          ) : null}
          {loading ? "Loading…" : `Load more ${noun}`}
        </Button>
      ) : null}
      {reachedEnd ? (
        <p
          className="type-caption text-muted-foreground focus-visible:outline-none"
          ref={end}
          tabIndex={-1}
        >
          That’s everything: {count} {noun}.
        </p>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {loadedMore && !loading ? `Showing ${count} ${noun}.` : ""}
      </p>
    </div>
  );
}
