import { calendarForToken } from "~/server/calendar-feed";

/** Calendar apps like the link to end in `.ics`. */
const ICS_SUFFIX = /\.ics$/;

const notFound = () =>
  new Response("Not found", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    status: 404,
  });

/**
 * A member's duties as an .ics feed for calendar apps (#105). The token in
 * the path is the only key; a wrong or replaced one is a plain 404.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const ics = await calendarForToken(token.replace(ICS_SUFFIX, ""), {
    origin: new URL(request.url).origin,
  });
  if (!ics) {
    return notFound();
  }
  return new Response(ics, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": 'inline; filename="perki-duties.ics"',
      "Content-Type": "text/calendar; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
