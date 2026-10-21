"use client";

import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    className="toaster group"
    icons={{
      error: <OctagonX className="h-4 w-4" />,
      info: <Info className="h-4 w-4" />,
      loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      success: <CircleCheck className="h-4 w-4" />,
      warning: <TriangleAlert className="h-4 w-4" />,
    }}
    style={
      {
        // Sonner's own theme CSS outranks utility classes, so the toast
        // takes its colors from these variables: a raised green surface,
        // no outline, like the site's dialogs.
        "--border-radius": "var(--radius-xl)",
        "--normal-bg": "var(--popover)",
        "--normal-border": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
      } as React.CSSProperties
    }
    // The site ships a single dark-green theme; no next-themes provider.
    theme="dark"
    toastOptions={{
      classNames: {
        actionButton: "!bg-primary !text-primary-foreground",
        cancelButton: "!bg-secondary !text-muted-foreground",
        description: "!text-muted-foreground",
        toast: "font-satoshi shadow-lg",
      },
    }}
    {...props}
  />
);

export { Toaster };
