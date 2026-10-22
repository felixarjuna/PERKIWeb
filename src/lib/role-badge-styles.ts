import { CodeXml, HandHelping, PenLine, User } from "lucide-react";
import type { BadgeProps } from "~/components/ui/badge";
import type { Role } from "./roles";

export const roleBadgeStyles = {
  member: { icon: User, variant: "draft" },
  mita: { icon: HandHelping, variant: "published" },
  owner: { icon: CodeXml, variant: "default" },
  writer: { icon: PenLine, variant: "review" },
} satisfies Record<Role, Pick<BadgeProps, "icon" | "variant">>;
