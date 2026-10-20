"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "~/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";

const sections = {
  Members: "/admin/dashboard",
  Schedules: "/admin/schedules",
  Takeaways: "/admin/takeaways",
} as const;

/** Layout for admin pages. Access is enforced on the server (requireAdmin). */
export default function AdminShell({
  children,
  section,
  title = section,
}: {
  children: ReactNode;
  section: keyof typeof sections;
  title?: string;
}) {
  return (
    <div className="type-body min-h-screen bg-background text-foreground">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0" id="main-content">
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator className="mr-2 h-4" orientation="vertical" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={sections[section]}>
                      {section}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="mx-auto w-full min-w-0 max-w-5xl p-4 sm:p-6">
            <h1 className="type-heading mb-6">{title}</h1>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
