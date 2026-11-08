import { Badge, type BadgeProps } from "~/components/ui/badge";
import { type MemberBookState, stateLabel } from "~/lib/library";

/** Cream when it can be taken now, muted when it can't. */
function variantOf(state: MemberBookState): BadgeProps["variant"] {
  if (state.overdue) {
    return "destructive";
  }
  if (state.kind === "available") {
    return "published";
  }
  if (state.kind === "reserved" && state.mine) {
    return "review";
  }
  return "draft";
}

/** A book's state as its member sees it: "Available", "Borrowed until 7 Dec", … */
export function BookStateBadge({
  state,
  className,
}: {
  state: MemberBookState;
  className?: string;
}) {
  return (
    <Badge className={className} size="status" variant={variantOf(state)}>
      <span>{stateLabel(state)}</span>
    </Badge>
  );
}
