"use client";

import {
  Content as SelectPrimitiveContent,
  Group as SelectPrimitiveGroup,
  Icon as SelectPrimitiveIcon,
  Item as SelectPrimitiveItem,
  ItemIndicator as SelectPrimitiveItemIndicator,
  ItemText as SelectPrimitiveItemText,
  Label as SelectPrimitiveLabel,
  Portal as SelectPrimitivePortal,
  Root as SelectPrimitiveRoot,
  ScrollDownButton as SelectPrimitiveScrollDownButton,
  ScrollUpButton as SelectPrimitiveScrollUpButton,
  Separator as SelectPrimitiveSeparator,
  Trigger as SelectPrimitiveTrigger,
  Value as SelectPrimitiveValue,
  Viewport as SelectPrimitiveViewport,
} from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

const Select = SelectPrimitiveRoot;

const SelectGroup = SelectPrimitiveGroup;

const SelectValue = SelectPrimitiveValue;

function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitiveTrigger>) {
  return (
    <SelectPrimitiveTrigger
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground [&>span]:line-clamp-1",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitiveIcon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitiveIcon>
    </SelectPrimitiveTrigger>
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitiveScrollUpButton>) {
  return (
    <SelectPrimitiveScrollUpButton
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitiveScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitiveScrollDownButton>) {
  return (
    <SelectPrimitiveScrollDownButton
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitiveScrollDownButton>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: ComponentProps<typeof SelectPrimitiveContent>) {
  return (
    <SelectPrimitivePortal>
      <SelectPrimitiveContent
        className={cn(
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=open]:animate-in",
          position === "popper" &&
            "data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitiveViewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitiveViewport>
        <SelectScrollDownButton />
      </SelectPrimitiveContent>
    </SelectPrimitivePortal>
  );
}

function SelectLabel({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitiveLabel>) {
  return (
    <SelectPrimitiveLabel
      className={cn("py-1.5 pr-2 pl-8 font-semibold text-sm", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitiveItem>) {
  return (
    <SelectPrimitiveItem
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitiveItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitiveItemIndicator>
      </span>

      <SelectPrimitiveItemText>{children}</SelectPrimitiveItemText>
    </SelectPrimitiveItem>
  );
}

function SelectSeparator({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitiveSeparator>) {
  return (
    <SelectPrimitiveSeparator
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
