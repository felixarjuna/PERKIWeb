import { SETTING_KEYS } from "~/lib/settings";
import { getSettings } from "~/server/settings";

const SEND_TIMEOUT_MS = 10_000;

// Validated in env.mjs; read directly so server tests need no full environment.
const apiKey = () => process.env.RESEND_API_KEY?.trim() ?? "";

export type EmailStatus = "sent" | "skipped" | "failed";

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

/** An absolute link to `path` on this site, for an email. */
export const siteUrl = (path: string) =>
  new URL(
    path,
    process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}`
  ).toString();

/**
 * Sends one email through Resend when staff turned email on: "skipped" when
 * it's off or not connected, "failed" without a sender or on any provider or
 * network error. Never throws, so a caller's write never depends on it.
 */
export async function sendEmail(email: {
  idempotencyKey: string;
  subject: string;
  text: string;
  to: string;
}): Promise<EmailStatus> {
  try {
    const config = await emailSettings();
    if (!(config.connected && config.enabled)) {
      return "skipped";
    }
    if (!config.sender) {
      return "failed";
    }
    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from: config.sender,
        subject: email.subject,
        text: email.text,
        to: [email.to],
      }),
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
        "Idempotency-Key": email.idempotencyKey,
      },
      method: "POST",
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
