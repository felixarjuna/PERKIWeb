"use client";

import { Calendar, Command, NotebookPen, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type * as React from "react";

import { NavMain } from "~/components/nav-main";
import { NavUser } from "~/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";

const navigation = [
  { icon: Users, title: "Members", url: "/admin/dashboard" },
  { icon: Calendar, title: "Schedules", url: "/admin/schedules" },
  { icon: NotebookPen, title: "Takeaways", url: "/admin/takeaways" },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const navMain = navigation.map((item) => ({
    ...item,
    isActive: pathname.startsWith(item.url),
  }));
  const user = {
    avatar: session?.user.image ?? "",
    email: session?.user.email ?? "",
    name: session?.user.name ?? "Admin",
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <div>
                <div className="flex aspect-square items-center justify-center rounded-lg bg-sidebar-primary p-2 text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Perki Aachen</span>
                  <span className="truncate text-xs">Christian fellowship</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
