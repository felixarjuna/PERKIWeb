"use client";

import {
  Fallback as AvatarPrimitiveFallback,
  Image as AvatarPrimitiveImage,
  Root as AvatarPrimitiveRoot,
} from "@radix-ui/react-avatar";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

function Avatar({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitiveRoot>) {
  return (
    <AvatarPrimitiveRoot
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitiveImage>) {
  return (
    <AvatarPrimitiveImage
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitiveFallback>) {
  return (
    <AvatarPrimitiveFallback
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback, AvatarImage };
