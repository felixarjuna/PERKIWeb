"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { AppSidebar } from "~/components/app-sidebar";
import Loader from "~/components/loader";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import useAuth from "~/hooks/use-auth";
import type { adminNavigation } from "./admin-navigation";

type AdminSection = (typeof adminNavigation)[number]["title"];

/** Transitional UI gate; server-side role enforcement is separate work. */
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
  const { authorized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
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
    <div className="type-body min-h-screen bg-background text-foreground">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-background" id="main-content">
          <header className="flex h-16 shrink-0 items-center gap-3 border-border/40 border-b px-4 sm:px-8">
            <SidebarTrigger />
            <span className="type-caption text-muted-foreground">
              Workspace
            </span>
            <span className="type-caption text-muted-foreground">/</span>
            <span className="type-body-sm">{section}</span>
          </header>
          <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-7 px-4 py-7 sm:px-8 sm:py-10 lg:px-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-2">
                <p className="type-eyebrow text-muted-foreground">
                  PERKI administration
                </p>
                <h1 className="type-title">{title}</h1>
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
