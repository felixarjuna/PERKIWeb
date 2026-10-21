import { beforeEach, describe, expect, it, vi } from "vitest";
import { settings } from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const ID = "1McH8SoN1ut6CfERNi6BSh45O8vhshfZElDA42FbTZMs";
const google = vi.hoisted(() => ({ opens: true }));
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
    google.opens = true;
  });

  it("has no schedule sheet until one is set", async () => {
    expect(await (await admin()).settings.scheduleSheet()).toBeNull();
  });

  it("saves the id from a pasted link and shows the file name", async () => {
    const api = await admin();

    expect(
      await api.settings.setScheduleSheet({
        link: `https://docs.google.com/spreadsheets/d/${ID}/edit?gid=960415741#gid=960415741`,
      })
    ).toEqual({ title: "2026 - Jadwal Pelayanan PERKI" });

    expect(await api.settings.scheduleSheet()).toMatchObject({
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

    expect(await api.settings.scheduleSheet()).toBeNull();
  });

  it("is staff-only", async () => {
    const member = callerFor((await insertUser()).id);
    await expect(member.settings.scheduleSheet()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      anonymousCaller().settings.setScheduleSheet({ link: ID })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
