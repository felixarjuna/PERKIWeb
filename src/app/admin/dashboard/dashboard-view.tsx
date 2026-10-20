"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { AppSidebar } from "~/components/app-sidebar";
import { columns } from "~/components/dashboard/columns";
import DataTable from "~/components/dashboard/data-table";
import Loader from "~/components/loader";
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
import useAuth from "~/hooks/use-auth";
import { api } from "~/trpc/react";

export default function DashboardView() {
  const router = useRouter();
  const { authorized } = useAuth();

  /** route back to admin page, if not authenticated. */
  React.useEffect(() => {
    if (!authorized) {
      router.push("/admin");
    }
  }, [authorized, router]);

  const { data, isLoading } = api.profiles.getUserProfiles.useQuery();

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
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/admin/dashboard">
                      Members
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-col gap-2 px-4 py-6 sm:px-6">
            <h1 className="type-title">Members</h1>
            <p className="type-body text-muted-foreground">
              Fellowship contact details and birthdays.
            </p>
          </div>

          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader message="Loading user profiles ..." />
            </div>
          ) : (
            <DataTable columns={columns} data={data ?? []} />
          )}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
