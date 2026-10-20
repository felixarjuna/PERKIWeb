/** Test-runner fixtures only. Never imported by the application. */
import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { encode } from "next-auth/jwt";
import postgres from "postgres";
import { assertLocalDatabase, BASE_URL, e2eEnv } from "./env";
import { uniqueSuffix } from "./fixtures";

interface TestAccount {
  readonly email: string;
  readonly id: string;
  readonly name: string;
}
const SESSION_DURATION_SECONDS = 60 * 60;
const MILLISECONDS_PER_SECOND = 1000;
const SESSION_COOKIE = "authjs.session-token";

export const createTestAccount = async (
  label: string
): Promise<TestAccount> => {
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const sql = postgres(e2eEnv.DATABASE_URL, { max: 1 });
  const suffix = uniqueSuffix();
  const user = {
    email: `${label}-${suffix}@e2e.test`,
    id: randomUUID(),
    name: `${label} ${suffix}`,
  };
  try {
    await sql.begin(async (tx) => {
      await tx`insert into "user" (id, email, name) values (${user.id}, ${user.email}, ${user.name})`;
      await tx`insert into account ("userId", type, provider, "providerAccountId") values (${user.id}, 'oidc', 'google', ${user.id})`;
    });
    return user;
  } finally {
    await sql.end();
  }
};

/** Surrounding app tests start after OAuth; no test provider exists in production. */
export const setTestSession = async (page: Page, user: TestAccount) => {
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const token = await encode({
    maxAge: SESSION_DURATION_SECONDS,
    salt: SESSION_COOKIE,
    secret: e2eEnv.NEXTAUTH_SECRET,
    token: { email: user.email, name: user.name, sub: user.id },
  });
  // Replace any session the app issued earlier; otherwise both cookies are
  // sent and the server may keep the previous user.
  await page.context().clearCookies({ name: SESSION_COOKIE });
  await page.context().addCookies([
    {
      expires: Date.now() / MILLISECONDS_PER_SECOND + SESSION_DURATION_SECONDS,
      httpOnly: true,
      name: SESSION_COOKIE,
      sameSite: "Lax",
      url: BASE_URL,
      value: token,
    },
  ]);
};
