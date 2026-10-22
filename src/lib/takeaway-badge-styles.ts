import { CheckCircle2, Eye, PencilLine } from "lucide-react";
import type { BadgeProps } from "~/components/ui/badge";
import type { TakeawayStatus } from "./db/schema/schema";

/** Presentation data for the shared Badge; status rules live in takeaway-status. */
export const takeawayBadgeStyles = {
  draft: { icon: PencilLine, variant: "draft" },
  in_review: { icon: Eye, variant: "review" },
  published: { icon: CheckCircle2, variant: "published" },
} satisfies Record<TakeawayStatus, Pick<BadgeProps, "icon" | "variant">>;
