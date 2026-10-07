"use client";

import {
  CheckboxItem as DropdownMenuPrimitiveCheckboxItem,
  Content as DropdownMenuPrimitiveContent,
  Group as DropdownMenuPrimitiveGroup,
  Item as DropdownMenuPrimitiveItem,
  ItemIndicator as DropdownMenuPrimitiveItemIndicator,
  Label as DropdownMenuPrimitiveLabel,
  Portal as DropdownMenuPrimitivePortal,
  RadioGroup as DropdownMenuPrimitiveRadioGroup,
  RadioItem as DropdownMenuPrimitiveRadioItem,
  Root as DropdownMenuPrimitiveRoot,
  Separator as DropdownMenuPrimitiveSeparator,
  Sub as DropdownMenuPrimitiveSub,
  SubContent as DropdownMenuPrimitiveSubContent,
  SubTrigger as DropdownMenuPrimitiveSubTrigger,
  Trigger as DropdownMenuPrimitiveTrigger,
} from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

const DropdownMenu = DropdownMenuPrimitiveRoot;

const DropdownMenuTrigger = DropdownMenuPrimitiveTrigger;

const DropdownMenuGroup = DropdownMenuPrimitiveGroup;

const DropdownMenuPortal = DropdownMenuPrimitivePortal;

const DropdownMenuSub = DropdownMenuPrimitiveSub;

const DropdownMenuRadioGroup = DropdownMenuPrimitiveRadioGroup;

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitiveSubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitiveSubTrigger
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto" />
    </DropdownMenuPrimitiveSubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitiveSubContent>) {
  return (
    <DropdownMenuPrimitiveSubContent
      className={cn(
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitiveContent>) {
  return (
    <DropdownMenuPrimitivePortal>
      <DropdownMenuPrimitiveContent
        className={cn(
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=open]:animate-in",
          className
        )}
        sideOffset={sideOffset}
        {...props}
      />
    </DropdownMenuPrimitivePortal>
  );
}

function DropdownMenuItem({
  className,
  inset,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitiveItem> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitiveItem
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitiveCheckboxItem>) {
  return (
    <DropdownMenuPrimitiveCheckboxItem
      checked={checked}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitiveItemIndicator>
          <Check className="h-4 w-4" />
        </DropdownMenuPrimitiveItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitiveCheckboxItem>
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitiveRadioItem>) {
  return (
    <DropdownMenuPrimitiveRadioItem
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitiveItemIndicator>
          <Circle className="h-2 w-2 fill-current" />
        </DropdownMenuPrimitiveItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitiveRadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitiveLabel> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitiveLabel
      className={cn(
        "px-2 py-1.5 font-semibold text-sm",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitiveSeparator>) {
  return (
    <DropdownMenuPrimitiveSeparator
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
