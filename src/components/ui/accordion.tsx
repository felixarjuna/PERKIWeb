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
  return <AccordionPrimitiveItem className={className} {...props} />;
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
          "type-subheading flex min-h-11 flex-1 items-center justify-between gap-3 rounded-md py-4 text-start hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 motion-safe:transition-transform motion-safe:duration-150"
        />
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
      className="type-body overflow-hidden motion-safe:data-[state=closed]:animate-accordion-up motion-safe:data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitiveContent>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
