import { expect, it } from "vitest";
import { inviteExpiry, inviteMessage, normalizeEmail } from "./access";

it("compares emails lowercased and trimmed", () => {
  expect(normalizeEmail("  Ana.Lee@Gmail.COM ")).toBe("ana.lee@gmail.com");
});

it("keeps an invite open for 30 days", () => {
  expect(inviteExpiry(new Date("2026-10-22T10:00:00Z")).toISOString()).toBe(
    "2026-11-21T10:00:00.000Z"
  );
});

it("writes a message that says which account to use, where, and until when", () => {
  const message = inviteMessage({
    email: "ana@gmail.com",
    expiresAt: new Date("2026-11-21T10:00:00Z"),
    role: "writer",
    signInUrl: "https://perki.example/auth/signin",
  });
  expect(message).toContain("write sermon summaries");
  expect(message).toContain("ana@gmail.com");
  expect(message).toContain("https://perki.example/auth/signin");
  expect(message).toContain("Writer");
  expect(message).toContain("21 November");
});
