import { ASSIGNABLE_ROLES, roleLabels } from "./roles";

/** How long an invite waits for its person to sign in. */
export const INVITE_LIFETIME_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The only role members may ask for; mita is given by invite or by a mita. */
export const REQUESTABLE_ROLES = ["writer"] as const;

export type InviteRole = (typeof ASSIGNABLE_ROLES)[number];

/** Reads a stored invite role; anything unexpected is treated as member. */
export const inviteRole = (stored: string): InviteRole =>
  ASSIGNABLE_ROLES.find((role) => role === stored) ?? "member";

/** Emails are compared lowercased and trimmed. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const inviteExpiry = (from: Date) =>
  new Date(from.getTime() + INVITE_LIFETIME_DAYS * DAY_MS);

const ROLE_PURPOSE: Record<InviteRole, string> = {
  member: "join the PERKI Aachen website",
  mita: "join the PERKI Aachen website as a mita",
  writer: "write sermon summaries on the PERKI Aachen website",
};

const expiryFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Berlin",
});

/** Ready-made text a mita sends on WhatsApp along with an invite. */
export function inviteMessage(invite: {
  email: string;
  expiresAt: Date;
  role: InviteRole;
  signInUrl: string;
}) {
  return [
    `Hi! You're invited to ${ROLE_PURPOSE[invite.role]}.`,
    `Sign in with Google using ${invite.email} here: ${invite.signInUrl}`,
    `You'll be a ${roleLabels[invite.role]} straight away. The invite is open until ${expiryFormat.format(invite.expiresAt)}.`,
  ].join("\n\n");
}
