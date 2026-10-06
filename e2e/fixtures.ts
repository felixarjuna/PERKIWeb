/** Accounts seeded by `global-setup.ts` before every e2e run. */
export const MEMBER = {
  email: "member@e2e.test",
  id: "e2e-member",
  name: "E2E Member",
  password: "e2e-password-123",
} as const;

/** Signed-in browser state written by `auth.setup.ts`. */
export const MEMBER_STORAGE_STATE = "e2e/.auth/member.json";

/** Unique suffix so tests never collide on shared data. */
export const uniqueSuffix = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
