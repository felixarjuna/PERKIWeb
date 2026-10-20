"use client";

import { Command, Users } from "lucide-react";
import Link from "next/link";
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

const navMain = [
  {
    icon: Users,
    isActive: true,
    title: "Members",
    url: "/admin/dashboard",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
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
              <Link href="/">
                <div className="flex aspect-square items-center justify-center rounded-lg bg-sidebar-primary p-2 text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="type-body-sm grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">Perki Aachen</span>
                  <span className="type-caption truncate">
                    Christian fellowship
                  </span>
                </div>
              </Link>
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
