"use client";

import {
  Item as ToggleGroupPrimitiveItem,
  Root as ToggleGroupPrimitiveRoot,
} from "@radix-ui/react-toggle-group";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

/** Segmented control: a filled track with the active option raised. */
function ToggleGroup({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitiveRoot>) {
  return (
    <ToggleGroupPrimitiveRoot
      className={cn(
        "inline-flex h-9 items-center gap-1 self-center rounded-lg bg-secondary p-1",
        className
      )}
      {...props}
    />
  );
}

function ToggleGroupItem({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitiveItem>) {
  return (
    <ToggleGroupPrimitiveItem
      className={cn(
        "type-caption inline-flex h-7 min-w-9 flex-1 items-center justify-center whitespace-nowrap rounded-md px-2.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-foreground",
        className
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
