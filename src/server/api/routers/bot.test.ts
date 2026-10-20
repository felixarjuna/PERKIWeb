import { TRPCError } from "@trpc/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { DEFAULT_BOT_URL } from "./bot";

const signedIn = async () =>
  callerFor((await insertUser({ role: "admin" })).id);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("bot.status", () => {
  it("reports the bot online when it answers", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("perki.bot"));
    vi.stubGlobal("fetch", fetch);
    const status = await (await signedIn()).bot.status();
    expect(status.online).toBe(true);
    expect(status.latencyMs).toEqual(expect.any(Number));
    expect(fetch).toHaveBeenCalledWith(DEFAULT_BOT_URL, expect.any(Object));
  });

  it("reports the bot offline on errors and failed responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValueOnce(new Error("timeout"))
        .mockResolvedValueOnce(new Response("down", { status: 503 }))
    );
    const caller = await signedIn();
    await expect(caller.bot.status()).resolves.toMatchObject({
      latencyMs: null,
      online: false,
    });
    await expect(caller.bot.status()).resolves.toMatchObject({
      online: false,
    });
  });

  it("is for admins only", async () => {
    await expect(anonymousCaller().bot.status()).rejects.toBeInstanceOf(
      TRPCError
    );
    const member = callerFor((await insertUser()).id);
    await expect(member.bot.status()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
