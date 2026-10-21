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
import { isStaffRole, type Role } from "~/lib/roles";

const GROUPS = ["Community", "Content"] as const;

/** Admin navigation, laid out like shadcn's sidebar-07 block. */
export function AppSidebar({
  viewerRole,
  discordUrl,
  driveConfigured,
  driveUrl,
  ...props
}: ComponentProps<typeof Sidebar> & {
  viewerRole: Role;
  discordUrl: string;
  /** Whether a Drive folder is set; writers get no URL, only this flag. */
  driveConfigured: boolean;
  driveUrl: string | null;
}) {
  const staff = isStaffRole(viewerRole);
  const navigation = navigationFor(viewerRole);
  const home = navigation[0].url;
  const groups = GROUPS.map((group) => ({
    group,
    items: navigation.filter((item) => item.group === group),
  })).filter(({ items }) => items.length > 0);
  const footerItems = navigation.filter((item) => item.group === "Footer");
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
        {groups.map(({ group, items }) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarMenu>
              {items.map((item) => {
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
        <SidebarGroup>
          <SidebarGroupLabel>Integrations</SidebarGroupLabel>
          <SidebarMenu>
            {staff ? <BotStatus /> : null}
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Discord server">
                <a href={discordUrl} rel="noopener noreferrer" target="_blank">
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
            {!staff && driveConfigured ? (
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      aria-disabled="true"
                      className="cursor-not-allowed opacity-50 aria-disabled:pointer-events-auto"
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
            ) : null}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Visit website">
              <Link href="/">
                <ArrowUpRight aria-hidden="true" />
                <span>Visit website</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {footerItems.map((item) => {
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
