import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl bg-card text-card-foreground", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
  );
}

function CardTitle({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("type-heading", className)} {...props} />;
}

function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
  );
}

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
