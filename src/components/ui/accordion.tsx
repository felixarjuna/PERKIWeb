"use client";

import {
  Content as AccordionPrimitiveContent,
  Header as AccordionPrimitiveHeader,
  Item as AccordionPrimitiveItem,
  Root as AccordionPrimitiveRoot,
  Trigger as AccordionPrimitiveTrigger,
} from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

const Accordion = AccordionPrimitiveRoot;

function AccordionItem({
  className,
  ...props
}: ComponentProps<typeof AccordionPrimitiveItem>) {
  return (
    <AccordionPrimitiveItem className={cn("border-b", className)} {...props} />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitiveTrigger>) {
  return (
    <AccordionPrimitiveHeader className="flex">
      <AccordionPrimitiveTrigger
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </AccordionPrimitiveTrigger>
    </AccordionPrimitiveHeader>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitiveContent>) {
  return (
    <AccordionPrimitiveContent
      className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitiveContent>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
