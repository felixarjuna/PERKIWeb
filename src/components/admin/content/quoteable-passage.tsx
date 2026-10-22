"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { QUOTE_MAX_LENGTH } from "~/lib/takeaway-comments";

/** Selection stays within the rendered takeaway, never the surrounding UI. */
export function QuoteablePassage({
  children,
  onQuote,
}: {
  children: ReactNode;
  onQuote: (text: string) => void;
}) {
  const passage = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const [selected, setSelected] = useState("");
  useEffect(() => {
    const readSelection = () => {
      const selection = window.getSelection();
      const container = passage.current;
      if (!(selection && container && selection.rangeCount === 1)) {
        setSelected("");
        return;
      }
      const range = selection.getRangeAt(0);
      setSelected(
        container.contains(range.startContainer) &&
          container.contains(range.endContainer)
          ? selection.toString().trim()
          : ""
      );
    };
    document.addEventListener("selectionchange", readSelection);
    return () => document.removeEventListener("selectionchange", readSelection);
  }, []);
  const tooLong = selected.length > QUOTE_MAX_LENGTH;
  return (
    <div className="space-y-4">
      <div className="sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-lg border bg-background p-3">
        <Button
          aria-describedby={hintId}
          disabled={!selected || tooLong}
          onClick={() => {
            onQuote(selected);
            window.getSelection()?.removeAllRanges();
            setSelected("");
          }}
          onPointerDown={(event) => event.preventDefault()}
          size="sm"
          type="button"
          variant="outline"
        >
          Quote selection
        </Button>
        <p className="text-muted-foreground text-sm" id={hintId} role="status">
          {tooLong
            ? `Select up to ${QUOTE_MAX_LENGTH} characters to quote.`
            : "Highlight a passage to quote it in your comment."}
        </p>
      </div>
      <div ref={passage}>{children}</div>
    </div>
  );
}
