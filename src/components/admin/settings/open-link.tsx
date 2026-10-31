import { ExternalLink } from "lucide-react";
import { DateTime } from "luxon";

interface Change {
  updatedAt: Date | null;
  updatedBy: string | null;
}

/** " Changed by <name> on <date>." after a setting's description. */
export const changedBy = ({ updatedAt, updatedBy }: Change) =>
  updatedAt
    ? ` Changed${updatedBy ? ` by ${updatedBy}` : ""} on ${DateTime.fromJSDate(updatedAt).toFormat("d LLL yyyy")}.`
    : "";

/** A setting's current link, opened in a new tab. */
export function OpenLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="type-body-sm inline-flex max-w-64 items-center gap-1.5 truncate rounded-md px-2 py-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span className="truncate">{label}</span>
      <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
    </a>
  );
}
