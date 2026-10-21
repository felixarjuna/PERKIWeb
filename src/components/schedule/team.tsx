import { PersonAvatar } from "~/components/person-avatar";
import type { Person } from "~/lib/people";
import { type ServingRole, servingRoleLabels } from "~/lib/serving-roles";
import { cn } from "~/lib/utils";

export type TeamSlot = Person & { role: ServingRole };

/** "Preached by" with the speaker's photo; nothing when there's no preacher. */
export function PreachedBy({
  team,
  className,
}: {
  team: readonly TeamSlot[];
  className?: string;
}) {
  const preacher = team.find((slot) => slot.role === "preacher");
  if (!preacher) {
    return null;
  }
  return (
    <p
      className={cn(
        "type-body-sm flex items-center gap-2 text-muted-foreground",
        className
      )}
    >
      <PersonAvatar person={preacher} size="sm" />
      Preached by {preacher.name}
    </p>
  );
}

/**
 * Who serves, in slot order, each with their role and avatar. The preacher is
 * left to `PreachedBy` unless `withPreacher` lists them here too.
 */
export function TeamList({
  team,
  withPreacher = false,
  className,
}: {
  team: readonly TeamSlot[];
  withPreacher?: boolean;
  className?: string;
}) {
  const slots = withPreacher
    ? team
    : team.filter((slot) => slot.role !== "preacher");
  if (slots.length === 0) {
    return null;
  }
  return (
    <dl
      className={cn("type-body-sm flex flex-wrap gap-x-5 gap-y-1.5", className)}
    >
      {slots.map((slot) => (
        <div
          className="flex items-center gap-1.5"
          key={`${slot.role}-${slot.name}`}
        >
          <dt className="text-muted-foreground">
            {servingRoleLabels[slot.role]}
          </dt>
          <dd className="flex min-w-0 items-center gap-1.5 break-words">
            <PersonAvatar person={slot} size="sm" />
            {slot.name}
          </dd>
        </div>
      ))}
    </dl>
  );
}
