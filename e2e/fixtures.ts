/** Accounts seeded by `global-setup.ts` before every e2e run. */
export const MEMBER = {
  email: "member@e2e.test",
  id: "e2e-member",
  name: "E2E Member",
  password: "e2e-password-123",
} as const;

/** Signed-in browser state written by `auth.setup.ts`. */
export const MEMBER_STORAGE_STATE = "e2e/.auth/member.json";

/** Passcode hardcoded in `src/components/login-form.tsx`. */
export const ADMIN_PASSCODE = {
  password: "gongxifacai2025",
  username: "mita",
} as const;

/** Prefix shared by every seeded dashboard member; sorts before test users. */
export const DASHBOARD_NAME_PREFIX = "Dash Seed";

/** One month (0-based) per seeded member, deliberately not in name order. */
const DASHBOARD_BIRTH_MONTHS = [4, 11, 0, 7, 2, 9, 5, 1, 10, 3, 8, 6] as const;
const BIRTH_YEAR = 1999;
const BIRTH_DAY = 15;

/**
 * Members with profiles seeded for the admin dashboard. There are more than
 * one page (10 rows) of them so pagination is exercised.
 */
export const DASHBOARD_MEMBERS = DASHBOARD_BIRTH_MONTHS.map((month, index) => {
  const number = String(index + 1).padStart(2, "0");
  return {
    birthday: new Date(Date.UTC(BIRTH_YEAR, month, BIRTH_DAY)),
    email: `dash${number}@e2e.test`,
    id: `e2e-dash-${number}`,
    name: `${DASHBOARD_NAME_PREFIX} ${number}`,
  };
});

/** Unique suffix so tests never collide on shared data. */
export const uniqueSuffix = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
