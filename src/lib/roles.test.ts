import { describe, expect, it } from "vitest";
import { canChangeRole, normalizeRole } from "~/lib/roles";

describe("roles", () => {
  it("treats the legacy admin value as mita and defaults to member", () => {
    expect(normalizeRole("admin")).toBe("mita");
    expect(normalizeRole("owner")).toBe("owner");
    expect(normalizeRole(null)).toBe("member");
    expect(normalizeRole("superuser")).toBe("member");
  });

  it("lets staff assign mita, writer and member, but never touch the owner", () => {
    expect(canChangeRole("mita", "member", "mita")).toBe(true);
    expect(canChangeRole("owner", "mita", "writer")).toBe(true);
    expect(canChangeRole("mita", "owner", "member")).toBe(false);
    expect(canChangeRole("mita", "member", "owner")).toBe(false);
    expect(canChangeRole("owner", "member", "owner")).toBe(false);
    expect(canChangeRole("writer", "member", "writer")).toBe(false);
    expect(canChangeRole("member", "member", "mita")).toBe(false);
  });
});
