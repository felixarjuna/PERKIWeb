import { describe, expect, it } from "vitest";
import { botStatusText } from "./bot-status";

const at = (time: string) => new Date(`2026-10-20T${time}:00`);

describe("bot status text", () => {
  it("shows the clock time of the last check while online", () => {
    expect(
      botStatusText({
        failed: false,
        lastOnlineAt: null,
        status: { checkedAt: at("14:36"), latencyMs: 120, online: true },
      })
    ).toEqual({
      detail: "Responding in 120 ms. Checked every minute, last at 14:36.",
      label: "Online",
    });
  });

  it("says how long the bot has been silent once it goes down", () => {
    expect(
      botStatusText({
        failed: false,
        lastOnlineAt: at("14:20"),
        now: at("14:36"),
        status: { checkedAt: at("14:36"), latencyMs: null, online: false },
      }).detail
    ).toBe(
      "No response since 14:20 (16 minutes ago). Birthday messages may not be sent."
    );
    expect(
      botStatusText({
        failed: false,
        lastOnlineAt: null,
        status: { checkedAt: at("14:36"), latencyMs: null, online: false },
      }).detail
    ).toBe("Not responding. Birthday messages may not be sent.");
  });

  it("separates a failed check from a bot that is down", () => {
    expect(botStatusText({ failed: true, lastOnlineAt: null })).toEqual({
      detail: "The status check itself failed.",
      label: "Unknown",
    });
  });
});
