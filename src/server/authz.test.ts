import { afterEach, describe, expect, it, vi } from "vitest";
import { insertUser } from "~/test/caller";
import { adminShellProps, canManageTakeaways, getRole, isAdmin } from "./authz";

const DRIVE = "https://drive.example.test/folder";

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

describe("adminShellProps", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("gives the Drive URL to staff only, and tells everyone it is configured", () => {
    vi.stubEnv("DRIVE_FOLDER_URL", DRIVE);
    expect(adminShellProps("writer")).toEqual({
      driveConfigured: true,
      driveUrl: null,
      viewerRole: "writer",
    });
    for (const role of ["mita", "owner"] as const) {
      expect(adminShellProps(role)).toEqual({
        driveConfigured: true,
        driveUrl: DRIVE,
        viewerRole: role,
      });
    }
  });

  it("reports no Drive at all when the folder is unset or empty", () => {
    for (const value of [undefined, ""]) {
      vi.stubEnv("DRIVE_FOLDER_URL", value);
      for (const role of ["writer", "mita", "owner"] as const) {
        expect(adminShellProps(role)).toMatchObject({
          driveConfigured: false,
          driveUrl: null,
        });
      }
    }
  });
});
