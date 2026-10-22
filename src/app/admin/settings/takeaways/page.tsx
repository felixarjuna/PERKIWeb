import AdminShell from "~/components/admin/admin-shell";
import { SettingsLayout } from "~/components/admin/settings/settings-layout";
import TakeawayDeadlineSettings from "~/components/admin/settings/takeaway-deadline-settings";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function TakeawaySettingsPage() {
  const { role } = await requireAdmin("/admin/settings/takeaways");
  return (
    <AdminShell {...(await adminShellProps(role))} section="Settings">
      <SettingsLayout
        active="takeaways"
        description="Choose when writers’ notes are due."
        title="Takeaways"
      >
        <TakeawayDeadlineSettings />
      </SettingsLayout>
    </AdminShell>
  );
}
