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
  variant = "default",
  ...props
}: ComponentProps<typeof SelectPrimitiveTrigger> & {
  variant?: "default" | "filter";
}) {
  return (
    <SelectPrimitiveTrigger
      className={cn(
        "type-body-sm flex h-10 w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-start ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground [&>span]:min-w-0 [&>span]:truncate",
        variant === "filter"
          ? "border-transparent bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80"
          : "border-transparent bg-secondary",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitiveIcon asChild>
        <ChevronDown
          aria-hidden="true"
          className="size-3.5 shrink-0 text-muted-foreground"
        />
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
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-y-auto overflow-x-hidden overscroll-contain rounded-xl border border-transparent bg-popover text-popover-foreground shadow-lg",
          position === "popper" && "w-(--radix-select-trigger-width)",
          className
        )}
        position={position}
        sideOffset={6}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitiveViewport
          className={cn("p-1.5", position === "popper" && "w-full")}
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
        "type-body-sm relative flex min-h-10 w-full cursor-default select-none items-center rounded-md py-2 pr-3 pl-9 outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[state=checked]:bg-secondary data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-3 flex size-3.5 items-center justify-center">
        <SelectPrimitiveItemIndicator>
          <Check aria-hidden="true" className="size-3.5" />
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
