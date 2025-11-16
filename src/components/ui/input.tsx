import * as React from "react";
import { cn } from "~/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      className={cn(
        "flex h-10 w-full rounded-lg bg-green-default/60 px-3 py-2 text-sm shadow-md file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-green-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-default dark:bg-green-default/60 dark:ring-offset-green-default/80 dark:focus-visible:ring-green-default dark:hover:bg-green-default/80 dark:placeholder:text-cream-default/50",
        className
      )}
      ref={ref}
      type={type}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
