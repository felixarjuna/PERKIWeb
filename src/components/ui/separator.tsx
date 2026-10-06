"use client";

import { Root as SeparatorPrimitiveRoot } from "@radix-ui/react-separator";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: ComponentProps<typeof SeparatorPrimitiveRoot>) {
  return (
    <SeparatorPrimitiveRoot
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      decorative={decorative}
      orientation={orientation}
      {...props}
    />
  );
}

export { Separator };
