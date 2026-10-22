import {
  CodeXml,
  HandHelping,
  type LucideIcon,
  PenLine,
  User,
} from "lucide-react";
import { type Role, roleLabels } from "~/lib/roles";
import { cn } from "~/lib/utils";

const roleStyles: Record<Role, { className: string; icon: LucideIcon }> = {
  member: { className: "bg-secondary text-muted-foreground", icon: User },
  mita: { className: "bg-paper text-paper-foreground", icon: HandHelping },
  owner: { className: "bg-primary text-primary-foreground", icon: CodeXml },
  writer: { className: "bg-accent text-foreground", icon: PenLine },
};

/** The icon each role is shown with, also on the account page. */
export const roleIcons: Record<Role, LucideIcon> = {
  member: roleStyles.member.icon,
  mita: roleStyles.mita.icon,
  owner: roleStyles.owner.icon,
  writer: roleStyles.writer.icon,
};

/**
 * A role pill sized to its label. The dev (stored as `owner`) gets a code
 * icon and mita a serving one rather than marks of rank; members get the
 * quietest tone.
 */
export function RoleBadge({
  className,
  value,
}: {
  className?: string;
  value: Role;
}) {
  const { className: tone, icon: Icon } = roleStyles[value];
  return (
    <span
      className={cn(
        "type-caption inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5",
        tone,
        className
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {roleLabels[value]}
    </span>
  );
}
