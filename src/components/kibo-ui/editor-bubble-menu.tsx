"use client";

import { BubbleMenu, type BubbleMenuProps } from "@tiptap/react/menus";
import { cn } from "~/lib/utils";

/**
 * Adapted from Kibo UI's editor registry (MIT), retrieved with shadcn view
 * @kibo-ui/editor. Only the selection menu is needed by the review reader.
 * https://www.kibo-ui.com/components/editor
 */
export function EditorBubbleMenu({
  className,
  children,
  ...props
}: BubbleMenuProps) {
  return (
    <BubbleMenu
      className={cn(
        "flex rounded-xl border bg-background p-0.5 shadow",
        "[&>*:first-child]:rounded-l-[9px]",
        "[&>*:last-child]:rounded-r-[9px]",
        className
      )}
      {...props}
    >
      {children}
    </BubbleMenu>
  );
}
