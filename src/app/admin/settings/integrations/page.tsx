import AdminShell from "~/components/admin/admin-shell";
import IntegrationSettings from "~/components/admin/settings/integration-settings";
import { SettingsLayout } from "~/components/admin/settings/settings-layout";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function IntegrationSettingsPage() {
  const { role } = await requireAdmin("/admin/settings/integrations");
  return (
    <AdminShell {...(await adminShellProps(role))} section="Settings">
      <SettingsLayout
        active="integrations"
        description="The outside services the workspace links to. Changes apply right away, without a new release."
        title="Integrations"
      >
        <IntegrationSettings />
      </SettingsLayout>
    </AdminShell>
  );
}
