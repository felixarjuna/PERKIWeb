import { Children, type ReactNode } from "react";
import { cn } from "~/lib/utils";

/**
 * Adapted from Kibo UI's avatar-stack registry item (MIT).
 * https://www.kibo-ui.com/components/avatar-stack
 * Spans instead of divs, since stacks sit inside buttons (accordion
 * triggers), the spread on hover only runs for motion-safe viewers, and the
 * avatar inside is sized by the caller (our Avatar has no data-slot).
 *
 * Avatars overlap slightly and each one after the first has a crescent cut
 * out where its neighbour sits, so the stack needs no ring in the surface
 * colour and works on any background.
 */
export function AvatarStack({
  children,
  className,
  animate = false,
  size = 32,
}: {
  children: ReactNode;
  className?: string;
  /** Spread the avatars apart while the stack is hovered. */
  animate?: boolean;
  /** Avatar diameter in pixels. */
  size?: number;
}) {
  return (
    <span
      className={cn(
        "flex items-center -space-x-1",
        animate &&
          "motion-safe:hover:space-x-0 motion-safe:[&>*]:transition-all",
        className
      )}
    >
      {Children.map(children, (child, index) =>
        child ? (
          <span
            className="block shrink-0 overflow-hidden rounded-full"
            style={{
              height: size,
              maskImage:
                index > 0
                  ? `radial-gradient(circle ${size / 2}px at -${size / 4 + size / 10}px 50%, transparent 99%, white 100%)`
                  : undefined,
              width: size,
            }}
          >
            {child}
          </span>
        ) : null
      )}
    </span>
  );
}
