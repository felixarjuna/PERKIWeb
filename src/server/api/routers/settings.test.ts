import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { settings } from "~/lib/db/schema/schema";
import { DEFAULT_DISCORD_INVITE_URL } from "~/lib/settings";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const ID = "1McH8SoN1ut6CfERNi6BSh45O8vhshfZElDA42FbTZMs";
const DOC = "1FATkCWWmfpL0sakmRK6Cxa-Nm5rKQXn6EiUAlviTRrc";
const google = vi.hoisted(() => ({ docOpens: true, opens: true }));
vi.mock("~/server/google-docs", () => ({
  docHtml: vi.fn(() =>
    google.docOpens
      ? Promise.resolve("<html><body></body></html>")
      : Promise.reject(new Error("Google Docs answered 401."))
  ),
}));
vi.mock("~/server/google-sheets", () => ({
  sheetTitle: vi.fn(() =>
    google.opens
      ? Promise.resolve("2026 - Jadwal Pelayanan PERKI")
      : Promise.reject(new Error("Google Sheets answered 403."))
  ),
}));

const admin = async () =>
  callerFor((await insertUser({ name: "Mita", role: "mita" })).id);

describe("settings router", () => {
  beforeEach(() => {
    google.docOpens = true;
    google.opens = true;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("starts with no sheet, no Drive folder and the default Discord invite", async () => {
    vi.stubEnv("DRIVE_FOLDER_URL", "");
    expect(await (await admin()).settings.integrations()).toEqual({
      discordInvite: {
        isDefault: true,
        updatedAt: null,
        updatedBy: null,
        url: DEFAULT_DISCORD_INVITE_URL,
      },
      driveFolder: null,
      scheduleSheet: null,
      takeawayNotesDoc: null,
      takeawayTldrDoc: null,
      whatsappGroup: null,
    });
  });

  it("saves the notes and TL;DR documents from pasted links, once Google opens them", async () => {
    const api = await admin();
    await api.settings.setTakeawayDoc({
      document: "notes",
      link: `https://docs.google.com/document/d/${DOC}/edit?tab=t.0`,
    });
    await expect(
      api.settings.setTakeawayDoc({
        document: "tldr",
        link: `https://docs.google.com/spreadsheets/d/${ID}/edit`,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    google.docOpens = false;
    await expect(
      api.settings.setTakeawayDoc({ document: "tldr", link: ID })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const saved = await api.settings.integrations();
    expect(saved.takeawayNotesDoc).toMatchObject({
      id: DOC,
      updatedBy: "Mita",
      url: `https://docs.google.com/document/d/${DOC}/edit`,
    });
    expect(saved.takeawayTldrDoc).toBeNull();

    await api.settings.setTakeawayDoc({ document: "notes", link: null });
    expect((await api.settings.integrations()).takeawayNotesDoc).toBeNull();
  });

  it("saves the sheet id from a pasted link and shows the file name", async () => {
    const api = await admin();

    expect(
      await api.settings.setScheduleSheet({
        link: `https://docs.google.com/spreadsheets/d/${ID}/edit?gid=960415741#gid=960415741`,
      })
    ).toEqual({ title: "2026 - Jadwal Pelayanan PERKI" });

    expect((await api.settings.integrations()).scheduleSheet).toMatchObject({
      id: ID,
      title: "2026 - Jadwal Pelayanan PERKI",
      updatedBy: "Mita",
      url: `https://docs.google.com/spreadsheets/d/${ID}/edit`,
    });
  });

  it("refuses a link that isn't a sheet, or a sheet Google can't open", async () => {
    const api = await admin();
    await expect(
      api.settings.setScheduleSheet({ link: "https://example.com" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    google.opens = false;
    await expect(
      api.settings.setScheduleSheet({ link: ID })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await testDb.select().from(settings)).toEqual([]);
  });

  it("removes the sheet", async () => {
    const api = await admin();
    await api.settings.setScheduleSheet({ link: ID });

    await api.settings.setScheduleSheet({ link: null });

    expect((await api.settings.integrations()).scheduleSheet).toBeNull();
  });

  it("shows a Drive folder still set in the environment until one is saved", async () => {
    vi.stubEnv("DRIVE_FOLDER_URL", "https://drive.google.com/old");
    const api = await admin();
    expect((await api.settings.integrations()).driveFolder).toMatchObject({
      fromEnvironment: true,
      url: "https://drive.google.com/old",
    });

    await api.settings.setDriveFolder({
      link: "https://drive.google.com/drive/folders/new",
    });

    expect((await api.settings.integrations()).driveFolder).toMatchObject({
      fromEnvironment: false,
      updatedBy: "Mita",
      url: "https://drive.google.com/drive/folders/new",
    });
    await expect(
      api.settings.setDriveFolder({ link: "https://example.com/folder" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("changes the Discord invite and goes back to the default", async () => {
    const api = await admin();
    await api.settings.setDiscordInvite({ link: "https://discord.gg/newcode" });
    expect((await api.settings.integrations()).discordInvite).toMatchObject({
      isDefault: false,
      url: "https://discord.gg/newcode",
    });

    await api.settings.setDiscordInvite({ link: null });
    expect((await api.settings.integrations()).discordInvite).toMatchObject({
      isDefault: true,
      url: DEFAULT_DISCORD_INVITE_URL,
    });
    await expect(
      api.settings.setDiscordInvite({ link: "https://example.com/invite/x" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("sets and removes the WhatsApp group link", async () => {
    const api = await admin();
    await api.settings.setWhatsappGroup({
      link: "https://chat.whatsapp.com/AbC123",
    });
    expect((await api.settings.integrations()).whatsappGroup).toMatchObject({
      updatedBy: "Mita",
      url: "https://chat.whatsapp.com/AbC123",
    });

    await api.settings.setWhatsappGroup({ link: null });
    expect((await api.settings.integrations()).whatsappGroup).toBeNull();
    await expect(
      api.settings.setWhatsappGroup({ link: "https://wa.me/49123" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("is staff-only", async () => {
    const member = callerFor((await insertUser()).id);
    await expect(member.settings.integrations()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      member.settings.setWhatsappGroup({ link: null })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      anonymousCaller().settings.setDiscordInvite({ link: null })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
