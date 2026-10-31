import AdminShell from "~/components/admin/admin-shell";
import { SettingsLayout } from "~/components/admin/settings/settings-layout";
import TakeawayDeadlineSettings from "~/components/admin/settings/takeaway-deadline-settings";
import TakeawaySourceSettings from "~/components/admin/settings/takeaway-source-settings";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function TakeawaySettingsPage() {
  const { role } = await requireAdmin("/admin/settings/takeaways");
  return (
    <AdminShell {...(await adminShellProps(role))} section="Settings">
      <SettingsLayout
        active="takeaways"
        description="When writers’ notes are due, and the documents Import from Docs reads."
        title="Takeaways"
      >
        <div className="space-y-8">
          <TakeawayDeadlineSettings />
          <TakeawaySourceSettings />
        </div>
      </SettingsLayout>
    </AdminShell>
  );
}
