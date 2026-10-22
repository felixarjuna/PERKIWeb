import { Globe, Lock } from "lucide-react";
import type { BadgeProps } from "~/components/ui/badge";

export const prayerBadgeStyles = {
  private: { icon: Lock, label: "Private", variant: "secondary" },
  published: { icon: Globe, label: "Published", variant: "published" },
} satisfies Record<
  "private" | "published",
  Pick<BadgeProps, "icon" | "variant"> & { label: string }
>;
