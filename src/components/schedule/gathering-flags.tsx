import { Badge } from "~/components/ui/badge";
import { FLAG_LABELS, orderedFlags } from "~/lib/schedule-flags";
import { cn } from "~/lib/utils";

/**
 * "Cancelled" and the gathering's event flags (Holy Communion, online,
 * Putzdienst) as chips; nothing when there are none.
 */
export function GatheringFlags({
  cancelled,
  flags,
  className,
}: {
  cancelled: boolean;
  flags: readonly string[];
  className?: string;
}) {
  const shown = orderedFlags(flags);
  if (!cancelled && shown.length === 0) {
    return null;
  }
  return (
    <ul
      aria-label="About this gathering"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {cancelled ? (
        <li>
          <Badge size="status" variant="destructive">
            Cancelled
          </Badge>
        </li>
      ) : null}
      {shown.map((flag) => (
        <li key={flag}>
          <Badge size="status" variant="published">
            {FLAG_LABELS[flag]}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
