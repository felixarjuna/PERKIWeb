import { CheckCircle2, Eye, type LucideIcon, PencilLine } from "lucide-react";
import type { TakeawayStatus } from "~/lib/db/schema/schema";
import { statusLabels } from "~/lib/takeaway-status";
import { cn } from "~/lib/utils";

const styles: Record<TakeawayStatus, { className: string; icon: LucideIcon }> =
  {
    draft: {
      className: "bg-secondary text-muted-foreground",
      icon: PencilLine,
    },
    in_review: { className: "bg-accent text-foreground", icon: Eye },
    published: {
      className: "bg-paper text-paper-foreground",
      icon: CheckCircle2,
    },
  };

/** A status pill: quiet for drafts, highlighted in review, cream once public. */
export function TakeawayStatusBadge({
  className,
  value,
}: {
  className?: string;
  value: TakeawayStatus;
}) {
  const { className: tone, icon: Icon } = styles[value];
  return (
    <span
      className={cn(
        "type-caption inline-flex min-h-7 w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1",
        tone,
        className
      )}
      data-slot="takeaway-status"
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0">
        <title>Takeaway status</title>
      </Icon>
      <span>{statusLabels[value]}</span>
    </span>
  );
}
