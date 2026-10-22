import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { settings } from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const provider = vi.fn();
const SENDER = "invites@example.com";

async function staff() {
  return callerFor((await insertUser({ role: "mita" })).id);
}

describe("optional invite email", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", provider);
    vi.stubEnv("RESEND_API_KEY", "test-only-key");
    vi.stubEnv("NEXTAUTH_URL", "https://perki.example.com");
    provider.mockReset();
    provider.mockResolvedValue(Response.json({ id: "email-1" }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("defaults off and exposes connection status without the key", async () => {
    const api = await staff();
    expect(await api.settings.email()).toEqual({
      connected: true,
      enabled: false,
      sender: "",
    });
    vi.stubEnv("RESEND_API_KEY", "");
    expect((await api.settings.email()).connected).toBe(false);
  });

  it("sends exactly one email with the role and sign-in link after saving", async () => {
    const api = await staff();
    await api.settings.setEmail({ enabled: true, sender: SENDER });
    provider.mockImplementation(async () => {
      expect(await api.access.invites()).toHaveLength(1);
      return await Promise.resolve(Response.json({ id: "email-1" }));
    });
    const result = await api.access.invite({
      email: " NEW@EXAMPLE.COM ",
      role: "writer",
    });
    expect(result.emailStatus).toBe("sent");
    expect(provider).toHaveBeenCalledTimes(1);
    const [url, request] = provider.mock.calls.at(0) ?? [];
    expect(url).toBe("https://api.resend.com/emails");
    expect(request).toMatchObject({
      headers: {
        Authorization: "Bearer test-only-key",
        "Content-Type": "application/json",
        "Idempotency-Key": `role-invite/${result.id}`,
      },
      method: "POST",
    });
    expect(JSON.parse(request.body)).toMatchObject({
      from: SENDER,
      text: expect.stringContaining("https://perki.example.com/auth/signin"),
      to: ["new@example.com"],
    });
    expect(JSON.parse(request.body).text).toContain("Writer");
    expect(JSON.stringify(await testDb.select().from(settings))).not.toContain(
      "test-only-key"
    );
    expect(await api.settings.email()).toEqual({
      connected: true,
      enabled: true,
      sender: SENDER,
    });
  });

  it.each(["disabled", "missing key"])(
    "skips delivery when %s",
    async (reason) => {
      const api = await staff();
      await api.settings.setEmail({
        enabled: reason !== "disabled",
        sender: SENDER,
      });
      if (reason === "missing key") {
        vi.stubEnv("RESEND_API_KEY", "");
      }
      expect(
        await api.access.invite({ email: "new@example.com", role: "member" })
      ).toMatchObject({ emailStatus: "skipped" });
      expect(provider).not.toHaveBeenCalled();
      expect(await api.access.invites()).toHaveLength(1);
    }
  );

  it.each(["http", "network", "timeout"])(
    "keeps the invite when delivery fails: %s",
    async (failure) => {
      const api = await staff();
      await api.settings.setEmail({ enabled: true, sender: SENDER });
      if (failure === "http") {
        provider.mockResolvedValue(
          Response.json({ message: "private provider error" }, { status: 403 })
        );
      } else {
        provider.mockRejectedValue(new Error(failure));
      }
      const result = await api.access.invite({
        email: "new@example.com",
        role: "mita",
      });
      expect(result.emailStatus).toBe("failed");
      expect(JSON.stringify(result)).not.toContain("private provider error");
      expect(await api.access.invites()).toHaveLength(1);
      expect(provider).toHaveBeenCalledTimes(1);
    }
  );

  it("validates the sender and requires one when enabling email", async () => {
    const api = await staff();
    await Promise.all(
      ["", "not-an-email", "a@example.com\r\nBcc: b@example.com"].map(
        (sender) =>
          expect(
            api.settings.setEmail({ enabled: true, sender })
          ).rejects.toMatchObject({ code: "BAD_REQUEST" })
      )
    );
    await api.settings.setEmail({ enabled: false, sender: "" });
    expect((await api.settings.email()).enabled).toBe(false);
  });

  it("restricts email configuration to staff", async () => {
    const member = callerFor((await insertUser()).id);
    await expect(member.settings.email()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      member.settings.setEmail({ enabled: true, sender: SENDER })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(anonymousCaller().settings.email()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
