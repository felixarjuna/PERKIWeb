import { describe, expect, it } from "vitest";
import { discordInviteFrom, driveUrlFrom, sheetIdFrom } from "./settings";

const ID = "1McH8SoN1ut6CfERNi6BSh45O8vhshfZElDA42FbTZMs";

describe("sheetIdFrom", () => {
  it("reads the id from a pasted link, whatever follows it", () => {
    expect(
      sheetIdFrom(
        `https://docs.google.com/spreadsheets/d/${ID}/edit?gid=960415741#gid=960415741`
      )
    ).toBe(ID);
    expect(
      sheetIdFrom(`  https://docs.google.com/spreadsheets/d/${ID}  `)
    ).toBe(ID);
  });

  it("accepts a bare id", () => {
    expect(sheetIdFrom(ID)).toBe(ID);
  });

  it("rejects anything else", () => {
    expect(sheetIdFrom("https://example.com/sheet")).toBeNull();
    expect(sheetIdFrom("2026")).toBeNull();
    expect(sheetIdFrom("")).toBeNull();
  });
});

describe("driveUrlFrom", () => {
  it("accepts Google Drive links only, over https", () => {
    expect(
      driveUrlFrom(" https://drive.google.com/drive/folders/abc123 ")
    ).toBe("https://drive.google.com/drive/folders/abc123");
    expect(
      driveUrlFrom("http://drive.google.com/drive/folders/abc")
    ).toBeNull();
    expect(driveUrlFrom("https://example.com/drive")).toBeNull();
    expect(driveUrlFrom("not a link")).toBeNull();
  });
});

describe("discordInviteFrom", () => {
  it("accepts discord.gg and discord.com invites", () => {
    expect(discordInviteFrom("https://discord.gg/4hf5yWFfVP")).toBe(
      "https://discord.gg/4hf5yWFfVP"
    );
    expect(discordInviteFrom("https://discord.com/invite/4hf5yWFfVP")).toBe(
      "https://discord.com/invite/4hf5yWFfVP"
    );
  });

  it("rejects other links", () => {
    expect(discordInviteFrom("https://discord.com/channels/1/2")).toBeNull();
    expect(discordInviteFrom("https://example.com/invite/x")).toBeNull();
    expect(discordInviteFrom("discord.gg/abc")).toBeNull();
  });
});
