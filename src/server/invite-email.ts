import { type InviteRole, inviteMessage } from "~/lib/access";
import { roleLabels } from "~/lib/roles";
import { type EmailStatus, sendEmail, siteUrl } from "~/server/email";

/** Called after the invite commits. Provider errors never undo the invite. */
export const sendInviteEmail = (invite: {
  id: number;
  email: string;
  expiresAt: Date;
  role: InviteRole;
}): Promise<EmailStatus> =>
  sendEmail({
    idempotencyKey: `role-invite/${invite.id}`,
    subject: `You're invited to PERKI Aachen as a ${roleLabels[invite.role]}`,
    text: inviteMessage({ ...invite, signInUrl: siteUrl("/auth/signin") }),
    to: invite.email,
  });
