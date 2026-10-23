import { Badge } from "~/components/ui/badge";
import type { TakeawayStatus } from "~/lib/db/schema/schema";
import { takeawayBadgeStyles } from "~/lib/takeaway-badge-styles";
import {
  type OpenRevisionStatus,
  revisionLabels,
} from "~/lib/takeaway-revisions";
import { statusLabels } from "~/lib/takeaway-status";

/**
 * A takeaway's status, and beside it the status of its open correction
 * (#74): "Published" stays true for the website while "Changes in review"
 * says what reviewers are working on.
 */
export function TakeawayStatusBadges({
  revision = null,
  status,
}: {
  readonly revision?: OpenRevisionStatus | null;
  readonly status: TakeawayStatus;
}) {
  return (
    <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
      <Badge
        data-slot="takeaway-status"
        size="status"
        {...takeawayBadgeStyles[status]}
      >
        {statusLabels[status]}
      </Badge>
      {revision ? (
        <Badge
          data-slot="takeaway-revision-status"
          size="status"
          {...takeawayBadgeStyles[revision]}
        >
          {revisionLabels[revision]}
        </Badge>
      ) : null}
    </span>
  );
}
