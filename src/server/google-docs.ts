const SIGN_IN_HOST = "accounts.google.com";

// Read directly so server tests need no full environment; e2e points it at a
// local stand-in that serves fixture documents.
const docsUrl = () => process.env.GOOGLE_DOCS_URL || "https://docs.google.com";

/**
 * A Google Doc as HTML, the way "Download → Web page" exports it. Works for
 * documents shared with "Anyone with the link" and needs no API key; a
 * private document answers with a sign-in page, which counts as a failure.
 */
export async function docHtml(docId: string): Promise<string> {
  const response = await fetch(
    `${docsUrl()}/document/d/${encodeURIComponent(docId)}/export?format=html`,
    { cache: "no-store" }
  );
  if (!response.ok || new URL(response.url).hostname === SIGN_IN_HOST) {
    throw new Error(`Google Docs answered ${response.status}.`);
  }
  return response.text();
}
