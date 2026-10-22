import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "px-2.5 py-0.5 font-semibold text-xs",
        status:
          // Trim the label to its letters (cap height to baseline), so the
          // flex centering lines the letters up with the icon. Without it,
          // Satoshi's metrics leave the text about 1.5px high.
          "type-caption min-h-7 w-fit shrink-0 gap-1 whitespace-nowrap px-2 py-1 font-medium [&>span]:[text-box:trim-both_cap_alphabetic] [&_svg]:size-3 [&_svg]:shrink-0",
      },
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        draft: "border-transparent bg-secondary text-muted-foreground",
        outline: "text-foreground",
        published: "border-transparent bg-paper text-paper-foreground",
        review: "border-transparent bg-accent text-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
    },
  }
);

export interface BadgeProps
  extends ComponentProps<"div">,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, size, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ size, variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
