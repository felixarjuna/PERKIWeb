import { redirect } from "next/navigation";
import { requireAdmin } from "~/server/authz";

/** Settings opens on its first section. */
export default async function SettingsPage() {
  await requireAdmin("/admin/settings");
  redirect("/admin/settings/integrations");
}
