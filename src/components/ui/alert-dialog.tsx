"use client";

import {
  Action as AlertDialogPrimitiveAction,
  Cancel as AlertDialogPrimitiveCancel,
  Content as AlertDialogPrimitiveContent,
  Description as AlertDialogPrimitiveDescription,
  Overlay as AlertDialogPrimitiveOverlay,
  Portal as AlertDialogPrimitivePortal,
  Root as AlertDialogPrimitiveRoot,
  Title as AlertDialogPrimitiveTitle,
  Trigger as AlertDialogPrimitiveTrigger,
} from "@radix-ui/react-alert-dialog";
import type { ComponentProps } from "react";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const AlertDialog = AlertDialogPrimitiveRoot;

const AlertDialogTrigger = AlertDialogPrimitiveTrigger;

const AlertDialogPortal = AlertDialogPrimitivePortal;

function AlertDialogOverlay({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitiveOverlay>) {
  return (
    <AlertDialogPrimitiveOverlay
      className={cn(
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitiveContent>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitiveContent
        className={cn(
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg bg-card p-6 text-card-foreground shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:max-w-lg",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitiveTitle>) {
  return (
    <AlertDialogPrimitiveTitle
      className={cn("font-semibold text-lg", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitiveDescription>) {
  return (
    <AlertDialogPrimitiveDescription
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitiveAction>) {
  return (
    <AlertDialogPrimitiveAction
      className={cn(buttonVariants(), className)}
      {...props}
    />
  );
}

function AlertDialogCancel({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitiveCancel>) {
  return (
    <AlertDialogPrimitiveCancel
      className={cn(
        buttonVariants({ variant: "outline" }),
        "mt-2 sm:mt-0",
        className
      )}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
