const E2E_PORT = 3100;

/** Base URL of the production build that Playwright drives. */
export const BASE_URL = `http://127.0.0.1:${E2E_PORT}`;

/**
 * Environment for the e2e server. Every value is a dummy except the database,
 * which must be the throwaway container from `compose.test.yml`.
 */
export const e2eEnv = {
  DATABASE_URL:
    process.env.E2E_DATABASE_URL ??
    "postgres://postgres:postgres@127.0.0.1:54329/perkiweb_test",
  GOOGLE_CLIENT_ID: "e2e-google-client-id",
  GOOGLE_CLIENT_SECRET: "e2e-google-client-secret",
  NEXT_PUBLIC_GOOGLE_API_KEY: "e2e-google-api-key",
  NEXTAUTH_SECRET: "e2e-secret-not-for-production",
  NEXTAUTH_URL: BASE_URL,
  PORT: String(E2E_PORT),
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
