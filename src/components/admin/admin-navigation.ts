import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  HandHeart,
  HeartHandshake,
  KeyRound,
  LayoutDashboard,
  Link2,
  Mic,
  NotebookPen,
  Settings,
  UserRoundCheck,
  UsersRound,
  Utensils,
} from "lucide-react";
import { isStaffRole, type Role } from "~/lib/roles";

export const adminNavigation = [
  {
    group: "Community",
    icon: LayoutDashboard,
    title: "Overview",
    url: "/admin/dashboard",
  },
  {
    group: "Community",
    icon: UsersRound,
    title: "Members",
    url: "/admin/members",
  },
  {
    group: "Community",
    icon: Utensils,
    parent: "Serving",
    title: "Cooking & cleaning",
    url: "/admin/groups",
  },
  {
    group: "Community",
    icon: UserRoundCheck,
    parent: "Serving",
    title: "Serving teams",
    url: "/admin/serving",
  },
  {
    group: "Community",
    icon: KeyRound,
    title: "Access",
    url: "/admin/access",
  },
  {
    group: "Community",
    icon: Link2,
    title: "Name links",
    url: "/admin/names",
  },
  {
    group: "Content",
    icon: CalendarDays,
    title: "Schedules",
    url: "/admin/schedules",
  },
  {
    group: "Content",
    icon: Mic,
    title: "Speakers",
    url: "/admin/speakers",
  },
  {
    group: "Content",
    icon: NotebookPen,
    title: "Takeaways",
    url: "/admin/takeaways",
  },
  {
    group: "Content",
    icon: HandHeart,
    title: "Prayers",
    url: "/admin/prayers",
  },
  // Rendered at the bottom of the sidebar, above the account menu.
  {
    group: "Footer",
    icon: Settings,
    title: "Settings",
    url: "/admin/settings",
  },
] as const;

/** The navigation entries a role may see: staff all, writers only takeaways. */
export const navigationFor = (role: Role) =>
  isStaffRole(role)
    ? adminNavigation
    : adminNavigation.filter((item) => item.url === "/admin/takeaways");

type NavigationItem = (typeof adminNavigation)[number];

/** Icons of the collapsible entries that hold several pages. */
const PARENT_ICONS: Record<string, LucideIcon> = { Serving: HeartHandshake };

export type SidebarEntry =
  | NavigationItem
  | { icon: LucideIcon; items: NavigationItem[]; title: string };

/**
 * The sidebar's entries in order: pages that share a `parent` are gathered
 * into one collapsible entry where the first of them stands.
 */
export function sidebarEntries(items: readonly NavigationItem[]) {
  const entries: SidebarEntry[] = [];
  for (const item of items) {
    const parent = "parent" in item ? item.parent : undefined;
    if (!parent) {
      entries.push(item);
      continue;
    }
    const existing = entries.find(
      (entry) => "items" in entry && entry.title === parent
    );
    if (existing && "items" in existing) {
      existing.items.push(item);
    } else {
      entries.push({
        icon: PARENT_ICONS[parent] ?? item.icon,
        items: [item],
        title: parent,
      });
    }
  }
  return entries;
}
