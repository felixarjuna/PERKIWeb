import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { initials, type Person } from "~/lib/people";
import { cn } from "~/lib/utils";

const SIZES = {
  lg: { fallback: "type-body-sm", root: "size-12" },
  md: { fallback: "type-caption", root: "size-8" },
  sm: { fallback: "type-caption", root: "size-6" },
} as const;

/**
 * A member's photo, or their initials when there is no photo (no account yet,
 * or a signed-out viewer). Decorative: the name is always written next to it.
 */
export function PersonAvatar({
  person,
  size = "md",
  className,
}: {
  person: Person;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <Avatar className={cn(SIZES[size].root, className)}>
      {person.image ? (
        <AvatarImage alt="" referrerPolicy="no-referrer" src={person.image} />
      ) : null}
      <AvatarFallback
        aria-hidden="true"
        className={cn(
          "bg-secondary font-satoshi text-secondary-foreground",
          SIZES[size].fallback
        )}
      >
        {initials(person.name)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Group members as faces with their name underneath, wrapping on small screens. */
export function PeopleGrid({
  people,
  className,
}: {
  people: readonly Person[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-x-3 gap-y-4", className)}>
      {people.map((person) => (
        <li
          className="flex w-16 flex-col items-center gap-1.5 text-center"
          key={person.name}
        >
          <PersonAvatar person={person} size="lg" />
          <span className="type-caption w-full truncate">{person.name}</span>
        </li>
      ))}
    </ul>
  );
}

/** A few overlapping faces and a count, for a compact summary of a group. */
export function AvatarStack({
  people,
  max = 5,
}: {
  people: readonly Person[];
  max?: number;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span aria-hidden="true" className="flex items-center">
      {shown.map((person) => (
        <PersonAvatar
          className="-ms-2 ring-2 ring-card first:ms-0"
          key={person.name}
          person={person}
        />
      ))}
      {rest > 0 ? (
        <span className="type-caption ms-1.5 text-muted-foreground">
          +{rest}
        </span>
      ) : null}
    </span>
  );
}
