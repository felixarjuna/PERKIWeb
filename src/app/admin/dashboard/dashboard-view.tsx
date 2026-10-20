"use client";

import AdminShell from "~/components/admin/admin-shell";
import { columns } from "~/components/dashboard/columns";
import DataTable from "~/components/dashboard/data-table";
import Loader from "~/components/loader";
import { api } from "~/trpc/react";

function MemberDirectory() {
  const { data, isLoading } = api.profiles.getUserProfiles.useQuery();
  return isLoading ? (
    <Loader message="Loading user profiles ..." />
  ) : (
    <DataTable columns={columns} data={data ?? []} />
  );
}

export default function DashboardView() {
  return (
    <AdminShell section="Members">
      <MemberDirectory />
    </AdminShell>
  );
}
