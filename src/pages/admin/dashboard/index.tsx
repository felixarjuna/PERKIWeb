import { useRouter } from "next/navigation";
import React from "react";
import { AppSidebar } from "~/components/app-sidebar";
import { columns } from "~/components/dashboard/columns";
import DataTable from "~/components/dashboard/data-table";
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
import useAuth from "~/hooks/useAuth";
import { api } from "~/utils/api";

export default function Page() {
  const router = useRouter();
  const { authorized } = useAuth();

  /** route back to admin page, if not authenticated. */
  React.useEffect(() => {
    if (!authorized) return router.push("/admin");
  }, [authorized, router]);

  const { data } = api.profiles.getUserProfiles.useQuery();

  return (
    <div className="dark overflow-x-scroll">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Members</BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <DataTable data={data ?? []} columns={columns} />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
