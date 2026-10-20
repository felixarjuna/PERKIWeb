"use client";
import AdminShell from "~/components/admin/admin-shell";
import CommunityOverview from "~/components/admin/overview/community-overview";

export default function DashboardView() {
  return (
    <AdminShell
      section="Overview"
      subtitle="A little perspective on the people who make this fellowship home."
      title="Your community, at a glance."
    >
      <CommunityOverview />
    </AdminShell>
  );
}
