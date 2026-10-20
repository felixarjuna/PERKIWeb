import {
  CalendarDays,
  HandHeart,
  LayoutDashboard,
  NotebookPen,
  UsersRound,
} from "lucide-react";

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
