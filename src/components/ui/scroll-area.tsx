"use client";

import {
  Corner as ScrollAreaPrimitiveCorner,
  Root as ScrollAreaPrimitiveRoot,
  ScrollAreaScrollbar as ScrollAreaPrimitiveScrollbar,
  ScrollAreaThumb as ScrollAreaPrimitiveThumb,
  Viewport as ScrollAreaPrimitiveViewport,
} from "@radix-ui/react-scroll-area";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

function ScrollArea({
  className,
  children,
  ...props
}: ComponentProps<typeof ScrollAreaPrimitiveRoot>) {
  return (
    <ScrollAreaPrimitiveRoot
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitiveViewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitiveViewport>
      <ScrollBar />
      <ScrollAreaPrimitiveCorner />
    </ScrollAreaPrimitiveRoot>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ComponentProps<typeof ScrollAreaPrimitiveScrollbar>) {
  return (
    <ScrollAreaPrimitiveScrollbar
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent p-[1px]",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent p-[1px]",
        className
      )}
      orientation={orientation}
      {...props}
    >
      <ScrollAreaPrimitiveThumb className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitiveScrollbar>
  );
}

export { ScrollArea, ScrollBar };
