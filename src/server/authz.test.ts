import { afterEach, describe, expect, it, vi } from "vitest";
import { settings } from "~/lib/db/schema/schema";
import { DEFAULT_DISCORD_INVITE_URL, SETTING_KEYS } from "~/lib/settings";
import { insertUser } from "~/test/caller";
import { testDb } from "~/test/db";
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

  it("gives the Drive URL to staff only, and tells everyone it is configured", async () => {
    vi.stubEnv("DRIVE_FOLDER_URL", DRIVE);
    expect(await adminShellProps("writer")).toEqual({
      discordUrl: DEFAULT_DISCORD_INVITE_URL,
      driveConfigured: true,
      driveUrl: null,
      viewerRole: "writer",
    });
    for (const role of ["mita", "owner"] as const) {
      // biome-ignore lint/performance/noAwaitInLoops: two roles, checked in order.
      expect(await adminShellProps(role)).toEqual({
        discordUrl: DEFAULT_DISCORD_INVITE_URL,
        driveConfigured: true,
        driveUrl: DRIVE,
        viewerRole: role,
      });
    }
  });

  it("prefers the links saved in Settings", async () => {
    vi.stubEnv("DRIVE_FOLDER_URL", DRIVE);
    await testDb.insert(settings).values([
      {
        key: SETTING_KEYS.driveFolderUrl,
        value: "https://drive.google.com/new",
      },
      { key: SETTING_KEYS.discordInviteUrl, value: "https://discord.gg/new" },
    ]);
    expect(await adminShellProps("mita")).toMatchObject({
      discordUrl: "https://discord.gg/new",
      driveUrl: "https://drive.google.com/new",
    });
  });

  it("reports no Drive at all when the folder is unset or empty", async () => {
    for (const value of [undefined, ""]) {
      vi.stubEnv("DRIVE_FOLDER_URL", value);
      for (const role of ["writer", "mita", "owner"] as const) {
        // biome-ignore lint/performance/noAwaitInLoops: a few roles, checked in order.
        expect(await adminShellProps(role)).toMatchObject({
          driveConfigured: false,
          driveUrl: null,
        });
      }
    }
  });
});
