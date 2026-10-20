"use client";

import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { ArrowUpRight, FolderOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ComponentProps } from "react";
import { navigationFor } from "~/components/admin/admin-navigation";
import { BotStatus } from "~/components/admin/bot-status";
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
  SidebarRail,
  useSidebar,
} from "~/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { DISCORD_INVITE_URL } from "~/lib/data";
import { isStaffRole, type Role } from "~/lib/roles";

const GROUPS = ["Community", "Content"] as const;

/** Admin navigation, laid out like shadcn's sidebar-07 block. */
export function AppSidebar({
  viewerRole,
  driveUrl,
  ...props
}: ComponentProps<typeof Sidebar> & {
  viewerRole: Role;
  driveUrl: string | null;
}) {
  const staff = isStaffRole(viewerRole);
  const home = navigationFor(viewerRole)[0].url;
  const { data: session } = useSession();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const close = () => setOpenMobile(false);
  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Mobile sheets add a close button in the top-right corner. */}
      <SidebarHeader className="pr-10 md:pr-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="PERKI Aachen">
              <Link href={home} onClick={close}>
                <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary font-reimbrandt text-lg text-sidebar-primary-foreground">
                  P
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium text-sm">
                    PERKI Aachen
                  </span>
                  <span className="truncate text-muted-foreground text-xs">
                    Community workspace
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {GROUPS.map((group) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarMenu>
              {navigationFor(viewerRole)
                .filter((item) => item.group === group)
                .map((item) => {
                  const active = pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                      >
                        <Link
                          aria-current={active ? "page" : undefined}
                          href={item.url}
                          onClick={close}
                        >
                          <item.icon aria-hidden="true" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            {staff ? <BotStatus /> : null}
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Discord server">
                <a
                  href={DISCORD_INVITE_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <DiscordLogoIcon aria-hidden="true" />
                  <span>Discord server</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {staff && driveUrl ? (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Google Drive">
                  <a href={driveUrl} rel="noopener noreferrer" target="_blank">
                    <FolderOpen aria-hidden="true" />
                    <span>Google Drive</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : null}
            {staff ? null : (
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      aria-disabled="true"
                      className="cursor-not-allowed opacity-50"
                      type="button"
                    >
                      <FolderOpen aria-hidden="true" />
                      <span>Google Drive</span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Only mita can open the Google Drive.
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Visit website">
                <Link href="/">
                  <ArrowUpRight aria-hidden="true" />
                  <span>Visit website</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            avatar: session?.user.image ?? "",
            email: session?.user.email ?? "",
            name: session?.user.name ?? "Administrator",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
