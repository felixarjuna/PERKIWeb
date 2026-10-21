import { describe, expect, it, vi } from "vitest";
import WelcomePage from "./page";

const REDIRECT = "NEXT_REDIRECT";
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`${REDIRECT} ${path}`);
  },
}));
vi.mock("~/server/auth", () => ({
  auth: () => Promise.resolve({ user: { id: "u1", name: "Maria" } }),
}));
vi.mock("~/trpc/server", () => ({
  api: {
    profiles: {
      // Before deploy:migrate adds user.welcomeSeenAt the query fails.
      mine: () =>
        Promise.reject(new Error('column "welcomeSeenAt" does not exist')),
    },
  },
}));

describe("welcome page", () => {
  it("moves on instead of failing when the profile can't be read", async () => {
    await expect(
      WelcomePage({
        searchParams: Promise.resolve({ callbackUrl: "/prayers" }),
      })
    ).rejects.toThrow(`${REDIRECT} /prayers`);
  });
});
