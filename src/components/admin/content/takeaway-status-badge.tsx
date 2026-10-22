import { CheckCircle2, Eye, type LucideIcon, PencilLine } from "lucide-react";
import { Badge, type BadgeProps } from "~/components/ui/badge";
import type { TakeawayStatus } from "~/lib/db/schema/schema";
import { statusLabels } from "~/lib/takeaway-status";

const styles: Record<
  TakeawayStatus,
  { variant: BadgeProps["variant"]; icon: LucideIcon }
> = {
  draft: {
    icon: PencilLine,
    variant: "draft",
  },
  in_review: { icon: Eye, variant: "review" },
  published: {
    icon: CheckCircle2,
    variant: "published",
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
  const { variant, icon: Icon } = styles[value];
  return (
    <Badge
      className={className}
      data-slot="takeaway-status"
      size="status"
      variant={variant}
    >
      <Icon aria-hidden="true" data-icon="inline-start">
        <title>Takeaway status</title>
      </Icon>
      <span>{statusLabels[value]}</span>
    </Badge>
  );
}
