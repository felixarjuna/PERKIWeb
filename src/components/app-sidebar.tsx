"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ComponentProps } from "react";
import { adminNavigation } from "~/components/admin/admin-navigation";
import { NavUser } from "~/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  return (
    <Sidebar {...props} className="border-border/40 border-r">
      <SidebarHeader className="px-6 py-8">
        <Link className="flex flex-col gap-1" href="/admin/dashboard">
          <span className="type-subheading">
            PERKI Aachen<span className="text-primary">.</span>
          </span>
          <span className="type-caption text-muted-foreground">
            Community workspace
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-3">
        {["Community", "Content"].map((group) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel className="type-eyebrow mb-2">
              {group}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {adminNavigation
                .filter((item) => item.group === group)
                .map((item) => {
                  const active = pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        className="h-11 rounded-lg px-3"
                        isActive={active}
                      >
                        <Link
                          aria-current={active ? "page" : undefined}
                          href={item.url}
                          onClick={() => setOpenMobile(false)}
                        >
                          <item.icon aria-hidden="true">
                            <title>{item.title}</title>
                          </item.icon>
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="gap-4 p-5">
        <Link
          className="type-body-sm flex items-center justify-between rounded-lg bg-sidebar-accent/40 p-3 text-muted-foreground hover:text-foreground"
          href="/"
        >
          Visit website{" "}
          <ArrowUpRight className="size-4">
            <title>Open website</title>
          </ArrowUpRight>
        </Link>
        <NavUser
          user={{
            avatar: session?.user.image ?? "",
            email: session?.user.email ?? "",
            name: session?.user.name ?? "Administrator",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
