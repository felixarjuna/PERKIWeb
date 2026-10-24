const E2E_PORT = Number(process.env.E2E_PORT ?? 3100);
/** Host port of the throwaway database; `compose.test.yml` reads the same variable. */
const E2E_DB_PORT = Number(process.env.E2E_DB_PORT ?? 54_329);
/** Port of the local stand-in for Google Docs (`e2e/docs-server.ts`). */
export const E2E_DOCS_PORT = Number(
  process.env.E2E_DOCS_PORT ?? E2E_PORT + 1000
);

/** Base URL of the production build that Playwright drives. */
export const BASE_URL = `http://localhost:${E2E_PORT}`;

/**
 * Environment for the e2e server. Every value is a dummy except the database,
 * which must be the throwaway container from `compose.test.yml`.
 */
export const e2eEnv = {
  AUTH_URL: BASE_URL,
  DATABASE_URL:
    process.env.E2E_DATABASE_URL ??
    `postgres://postgres:postgres@127.0.0.1:${E2E_DB_PORT}/perkiweb_test`,
  // A dummy folder so the sidebar renders its Drive items (hidden when unset).
  DRIVE_FOLDER_URL: "https://drive.example.test/e2e-folder",
  GOOGLE_CLIENT_ID: "e2e-google-client-id",
  GOOGLE_CLIENT_SECRET: "e2e-google-client-secret",
  // Document imports read fixture documents, never the real Google Docs.
  GOOGLE_DOCS_URL: `http://127.0.0.1:${E2E_DOCS_PORT}`,
  NEXT_PUBLIC_GOOGLE_API_KEY: "e2e-google-api-key",
  NEXTAUTH_SECRET: "e2e-secret-not-for-production",
  NEXTAUTH_URL: BASE_URL,
  // Never contact the real bot from tests; nothing listens on port 9.
  PERKI_BOT_URL: "http://127.0.0.1:9",
  PORT: String(E2E_PORT),
  // Browser tests never send real emails, even with a local credential set.
  RESEND_API_KEY: "",
};

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

/** Refuses to run e2e tests against anything but a local database. */
export const assertLocalDatabase = (url: string) => {
  const { hostname } = new URL(url);
  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(
      `E2E tests wipe the database; refusing to use non-local host "${hostname}".`
    );
  }
};
