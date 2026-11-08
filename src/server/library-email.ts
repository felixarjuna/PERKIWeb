import { inArray } from "drizzle-orm";
import { users } from "~/lib/db/schema/schema";
import { dayLabel } from "~/lib/library";
import { db } from "~/server";
import { type EmailStatus, sendEmail, siteUrl } from "~/server/email";

/** A reservation that just became its member's turn. */
export interface ReadyNotice {
  expiresOn: string;
  reservationId: number;
  title: string;
  userId: string;
}

/** The email's text: what's waiting, until when, and where to borrow it. */
export const readyMessage = ({
  expiresOn,
  libraryUrl,
  name,
  title,
}: {
  expiresOn: string;
  libraryUrl: string;
  name: string | null;
  title: string;
}) =>
  [
    `Hi ${name?.trim() || "there"},`,
    "",
    `${title} is back at the PERKI library and it's your turn. It's held for you until ${dayLabel(expiresOn)}.`,
    "",
    "Pick it up at the shelf and tap Borrow with the book in hand:",
    libraryUrl,
    "",
    "If you no longer want it, leave the queue there and it passes to the next person.",
  ].join("\n");

/**
 * One best-effort "<title> is ready for you" email per notice, all at once.
 * Called after the hold commits; an email never undoes it, and one slow or
 * failing email never holds up another.
 */
export async function sendReadyEmails(
  notices: readonly ReadyNotice[]
): Promise<EmailStatus[]> {
  if (notices.length === 0) {
    return [];
  }
  try {
    const people = await db
      .select({ email: users.email, id: users.id, name: users.name })
      .from(users)
      .where(
        inArray(
          users.id,
          notices.map((notice) => notice.userId)
        )
      );
    const byId = new Map(people.map((person) => [person.id, person]));
    const sent = await Promise.allSettled(
      notices.map((notice) => {
        const person = byId.get(notice.userId);
        if (!person?.email) {
          return Promise.resolve<EmailStatus>("skipped");
        }
        return sendEmail({
          idempotencyKey: `library-ready/${notice.reservationId}`,
          subject: `${notice.title} is ready for you`,
          text: readyMessage({
            expiresOn: notice.expiresOn,
            libraryUrl: siteUrl("/library"),
            name: person.name,
            title: notice.title,
          }),
          to: person.email,
        });
      })
    );
    return sent.map((result) =>
      result.status === "fulfilled" ? result.value : "failed"
    );
  } catch {
    return notices.map(() => "failed");
  }
}

/**
 * Sends the ready emails without making the caller wait: a library read or
 * write answers at once, and the hold never depends on the email.
 */
export function sendReadyEmailsLater(notices: readonly ReadyNotice[]) {
  if (notices.length > 0) {
    sendReadyEmails(notices).catch(() => undefined);
  }
}
