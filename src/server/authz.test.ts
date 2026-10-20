import { describe, expect, it } from "vitest";
import { insertUser } from "~/test/caller";
import { canManageTakeaways, getRole, isAdmin } from "./authz";

describe("authz", () => {
  it("reads roles from the database, with admin meaning mita", async () => {
    const legacy = await insertUser({ role: "admin" });
    const writer = await insertUser({ role: "writer" });
    expect(await getRole(legacy.id)).toBe("mita");
    expect(await isAdmin(legacy.id)).toBe(true);
    expect(await isAdmin(writer.id)).toBe(false);
    expect(await canManageTakeaways(writer.id)).toBe(true);
  });

  it("allows only one owner", async () => {
    await insertUser({ role: "owner" });
    await expect(insertUser({ role: "owner" })).rejects.toThrow();
  });

  it("rejects unknown role values", async () => {
    await expect(insertUser({ role: "superuser" as never })).rejects.toThrow();
  });
});
