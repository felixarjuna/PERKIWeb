"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { AppSidebar } from "~/components/app-sidebar";
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

const sections = {
  Members: "/admin/dashboard",
  Schedules: "/admin/schedules",
  Takeaways: "/admin/takeaways",
} as const;

/** Retains the existing UI passcode gate. Server-side RBAC is separate work. */
export default function AdminShell({
  children,
  section,
  title = section,
}: {
  children: ReactNode;
  section: keyof typeof sections;
  title?: string;
}) {
  const { authorized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (mounted && !authorized) {
      const query = new URLSearchParams({
        callbackUrl: `${pathname}${window.location.search}`,
      });
      router.replace(`/admin?${query}`);
    }
  }, [authorized, mounted, pathname, router]);
  if (!(mounted && authorized)) {
    return <Loader message="Opening admin sign-in ..." />;
  }
  return (
    <div className="dark min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0">
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
            <h1 className="mb-6 font-reimbrandt text-2xl leading-tight sm:text-3xl">
              {title}
            </h1>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
