import {
  CalendarDays,
  HandHeart,
  LayoutDashboard,
  Link2,
  NotebookPen,
  UsersRound,
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
] as const;

/** The navigation entries a role may see: staff all, writers only takeaways. */
export const navigationFor = (role: Role) =>
  isStaffRole(role)
    ? adminNavigation
    : adminNavigation.filter((item) => item.url === "/admin/takeaways");
