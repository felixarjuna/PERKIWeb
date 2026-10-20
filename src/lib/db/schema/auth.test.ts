import { describe, expect, it } from "vitest";
import { updateUserParams } from "./auth";

describe("Google account updates", () => {
  it("accepts a display name without email or password", () => {
    expect(
      updateUserParams.parse({ id: "user-1", name: "  Member  " })
    ).toEqual({ id: "user-1", name: "Member" });
  });
  it("does not expose identity or password changes", () => {
    expect(
      updateUserParams.parse({
        email: "changed@example.com",
        hashedPassword: "injected",
        id: "user-1",
        image: "https://evil.test/avatar",
        name: "Member",
        username: "changed",
      })
    ).toEqual({ id: "user-1", name: "Member" });
  });
  it.each(["", "   "])("rejects blank names", (name) => {
    expect(updateUserParams.safeParse({ id: "user-1", name }).success).toBe(
      false
    );
  });
});
