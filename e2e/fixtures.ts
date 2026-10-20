/** Accounts seeded by `global-setup.ts` before every e2e run. */
export const MEMBER = {
  email: "member@e2e.test",
  id: "e2e-member",
  name: "E2E Member",
} as const;

/** Signed-in browser state written by `auth.setup.ts`. */
export const MEMBER_STORAGE_STATE = "e2e/.auth/member.json";

/** Seeded with role `mita` (staff); can open every admin page. */
export const ADMIN = {
  email: "admin@e2e.test",
  id: "e2e-admin",
  name: "E2E Admin",
} as const;

/** The single seeded owner; has a profile so the directory lists it. */
export const OWNER = {
  email: "owner@e2e.test",
  id: "e2e-owner",
  name: "E2E Owner",
} as const;

/** Seeded writers; they only reach the takeaways pages. */
export const WRITER = {
  email: "writer@e2e.test",
  id: "e2e-writer",
  name: "E2E Writer",
} as const;

export const WRITER_2 = {
  email: "writer2@e2e.test",
  id: "e2e-writer-2",
  name: "E2E Writerb",
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
