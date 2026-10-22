import { type InviteRole, inviteMessage } from "~/lib/access";
import { roleLabels } from "~/lib/roles";
import { SETTING_KEYS } from "~/lib/settings";
import { getSettings } from "~/server/settings";

const SEND_TIMEOUT_MS = 10_000;

// Validated in env.mjs; read directly so server tests need no full environment.
const apiKey = () => process.env.RESEND_API_KEY?.trim() ?? "";

/** Only connection status and staff-editable values ever leave the server. */
export async function emailSettings() {
  const values = await getSettings([
    SETTING_KEYS.emailEnabled,
    SETTING_KEYS.emailSender,
  ]);
  return {
    connected: Boolean(apiKey()),
    enabled: values[SETTING_KEYS.emailEnabled] === "true",
    sender: values[SETTING_KEYS.emailSender] ?? "",
  };
}

/** Called after the invite commits. Provider errors never undo the invite. */
export async function sendInviteEmail(invite: {
  id: number;
  email: string;
  expiresAt: Date;
  role: InviteRole;
}): Promise<"sent" | "skipped" | "failed"> {
  try {
    const config = await emailSettings();
    if (!(config.connected && config.enabled)) {
      return "skipped";
    }
    if (!config.sender) {
      return "failed";
    }
    const baseUrl = process.env.NEXTAUTH_URL;
    const signInUrl = new URL(
      "/auth/signin",
      baseUrl || `https://${process.env.VERCEL_URL}`
    ).toString();
    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from: config.sender,
        subject: `You're invited to PERKI Aachen as a ${roleLabels[invite.role]}`,
        text: inviteMessage({ ...invite, signInUrl }),
        to: [invite.email],
      }),
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `role-invite/${invite.id}`,
      },
      method: "POST",
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
