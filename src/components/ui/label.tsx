"use client";

import { Root as LabelPrimitiveRoot } from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

const labelVariants = cva(
  "font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

function Label({
  className,
  ...props
}: ComponentProps<typeof LabelPrimitiveRoot> &
  VariantProps<typeof labelVariants>) {
  return (
    <LabelPrimitiveRoot className={cn(labelVariants(), className)} {...props} />
  );
}

export { Label };
