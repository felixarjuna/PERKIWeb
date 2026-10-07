"use client";

import {
  Close as DialogPrimitiveClose,
  Content as DialogPrimitiveContent,
  Description as DialogPrimitiveDescription,
  Overlay as DialogPrimitiveOverlay,
  Portal as DialogPrimitivePortal,
  Root as DialogPrimitiveRoot,
  Title as DialogPrimitiveTitle,
  Trigger as DialogPrimitiveTrigger,
} from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

const Dialog = DialogPrimitiveRoot;

const DialogTrigger = DialogPrimitiveTrigger;

const DialogPortal = DialogPrimitivePortal;

const DialogClose = DialogPrimitiveClose;

function DialogOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitiveOverlay>) {
  return (
    <DialogPrimitiveOverlay
      className={cn(
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in",
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitiveContent>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitiveContent
        className={cn(
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg bg-card p-6 text-card-foreground shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitiveClose className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitiveClose>
      </DialogPrimitiveContent>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: ComponentProps<"div">) {
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

function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitiveTitle>) {
  return (
    <DialogPrimitiveTitle
      className={cn(
        "font-semibold text-lg leading-none tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitiveDescription>) {
  return (
    <DialogPrimitiveDescription
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
