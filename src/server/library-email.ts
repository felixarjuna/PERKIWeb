import { inArray } from "drizzle-orm";
import { users } from "~/lib/db/schema/schema";
import { dayLabel } from "~/lib/library";
import { db } from "~/server";
import { emailSettings } from "~/server/invite-email";

const SEND_TIMEOUT_MS = 10_000;

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
  libraryUrl: link,
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
    link,
    "",
    "If you no longer want it, leave the queue there and it passes to the next person.",
  ].join("\n");

const libraryUrl = () =>
  new URL(
    "/library",
    process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}`
  ).toString();

const apiKey = () => process.env.RESEND_API_KEY?.trim() ?? "";

/**
 * One best-effort "<title> is ready for you" email per notice, called after
 * the hold commits. Off, or a provider error, never undoes the hold.
 */
export async function sendReadyEmails(
  notices: readonly ReadyNotice[]
): Promise<("sent" | "skipped" | "failed")[]> {
  if (notices.length === 0) {
    return [];
  }
  try {
    const config = await emailSettings();
    if (!(config.connected && config.enabled)) {
      return notices.map(() => "skipped");
    }
    if (!config.sender) {
      return notices.map(() => "failed");
    }
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
    return await Promise.all(
      notices.map(async (notice) => {
        const person = byId.get(notice.userId);
        if (!person?.email) {
          return "skipped" as const;
        }
        try {
          const response = await fetch("https://api.resend.com/emails", {
            body: JSON.stringify({
              from: config.sender,
              subject: `${notice.title} is ready for you`,
              text: readyMessage({
                expiresOn: notice.expiresOn,
                libraryUrl: libraryUrl(),
                name: person.name,
                title: notice.title,
              }),
              to: [person.email],
            }),
            headers: {
              Authorization: `Bearer ${apiKey()}`,
              "Content-Type": "application/json",
              "Idempotency-Key": `library-ready/${notice.reservationId}`,
            },
            method: "POST",
            signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
          });
          return response.ok ? ("sent" as const) : ("failed" as const);
        } catch {
          return "failed" as const;
        }
      })
    );
  } catch {
    return notices.map(() => "failed");
  }
}
