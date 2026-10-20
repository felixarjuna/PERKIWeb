import { Globe, Lock } from "lucide-react";
import { cn } from "~/lib/utils";

/** "Published" / "Private" chip shared by the wall and the admin review list. */
export default function PrayerStatus({
  published,
  privateLabel = "Private",
}: {
  published: boolean;
  /** E.g. "Waiting for review" when shown to the author. */
  privateLabel?: string;
}) {
  const Icon = published ? Globe : Lock;
  const label = published ? "Published" : privateLabel;
  return (
    <span
      className={cn(
        "type-caption inline-flex items-center gap-1 rounded-full px-2 py-1",
        published
          ? "bg-paper text-paper-foreground"
          : "bg-secondary text-secondary-foreground"
      )}
    >
      <Icon aria-hidden="true" className="size-3" />
      {label}
    </span>
  );
}
