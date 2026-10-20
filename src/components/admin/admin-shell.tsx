"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AppSidebar } from "~/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import type { adminNavigation } from "./admin-navigation";

type AdminSection = (typeof adminNavigation)[number]["title"];

/** Layout for admin pages. Access is enforced on the server (requireAdmin). */
export default function AdminShell({
  children,
  section,
  title = section,
  subtitle,
  actions,
}: {
  children: ReactNode;
  section: AdminSection;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="type-body min-h-screen bg-background text-foreground">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-background" id="main-content">
          <header className="flex h-14 shrink-0 items-center gap-2 border-border/40 border-b px-3 sm:h-16 sm:px-6">
            <SidebarTrigger className="size-10" />
            <Separator className="mx-1 h-4" orientation="vertical" />
            <Breadcrumb>
              <BreadcrumbList className="type-body-sm flex-nowrap gap-1.5 sm:gap-2">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/admin/dashboard">Workspace</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{section}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <h1 className="type-heading">{title}</h1>
                {subtitle ? (
                  <p className="type-body-sm max-w-xl text-muted-foreground">
                    {subtitle}
                  </p>
                ) : null}
              </div>
              {actions ? (
                <div className="flex flex-wrap gap-2">{actions}</div>
              ) : null}
            </div>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
