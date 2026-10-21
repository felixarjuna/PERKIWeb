import AdminShell from "~/components/admin/admin-shell";
import SpeakerManager from "~/components/admin/speakers/speaker-manager";
import { adminShellProps, requireAdmin } from "~/server/authz";

export default async function SpeakersPage() {
  const { role } = await requireAdmin("/admin/speakers");
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      section="Speakers"
      subtitle="Guest pastors who preach at our services."
    >
      <SpeakerManager />
    </AdminShell>
  );
}
