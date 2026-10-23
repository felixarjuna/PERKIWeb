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
      // Concentric with the buttons inside: their radius plus the padding
      // and the border, so both curves follow one centre.
      className={cn(
        "flex rounded-[calc(var(--radius-md)+3px)] border bg-background p-0.5 shadow",
        className
      )}
      {...props}
    >
      {children}
    </BubbleMenu>
  );
}
