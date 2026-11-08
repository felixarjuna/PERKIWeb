import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callerFor, insertUser } from "~/test/caller";
import {
  readyMessage,
  sendReadyEmails,
  sendReadyEmailsLater,
} from "./library-email";

const later = vi.hoisted(() => ({
  inRequest: true,
  tasks: [] as (() => Promise<unknown>)[],
}));
// Next's `after` only works inside a request; tests choose either case.
vi.mock("next/server", () => ({
  after: (task: () => Promise<unknown>) => {
    if (!later.inRequest) {
      throw new Error("`after` was called outside a request scope");
    }
    later.tasks.push(task);
  },
}));

const provider = vi.fn();
const SENDER = "library@example.com";

const notice = (userId: string) => ({
  expiresOn: "2026-11-14",
  reservationId: 7,
  title: "Mere Christianity",
  userId,
});

const enableEmail = async () => {
  const mita = await insertUser({ role: "mita" });
  await callerFor(mita.id).settings.setEmail({ enabled: true, sender: SENDER });
};

describe("library ready email", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", provider);
    vi.stubEnv("RESEND_API_KEY", "test-only-key");
    vi.stubEnv("NEXTAUTH_URL", "https://perki.example.com");
    provider.mockReset();
    provider.mockResolvedValue(Response.json({ id: "email-1" }));
    later.tasks = [];
    later.inRequest = true;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("says what's held, until when and where to borrow it", () => {
    const text = readyMessage({
      expiresOn: "2026-11-14",
      libraryUrl: "https://perki.example.com/library",
      name: "Budi",
      title: "Mere Christianity",
    });
    expect(text).toContain("Hi Budi,");
    expect(text).toContain("held for you until 14 Nov");
    expect(text).toContain("https://perki.example.com/library");
  });

  it("sends one email per hold to the member", async () => {
    await enableEmail();
    const budi = await insertUser({ email: "budi@example.com", name: "Budi" });
    expect(await sendReadyEmails([notice(budi.id)])).toEqual(["sent"]);
    expect(provider).toHaveBeenCalledTimes(1);
    const [url, request] = provider.mock.calls.at(0) ?? [];
    expect(url).toBe("https://api.resend.com/emails");
    expect(request).toMatchObject({
      headers: {
        Authorization: "Bearer test-only-key",
        "Idempotency-Key": "library-ready/7",
      },
      method: "POST",
    });
    expect(JSON.parse(request.body)).toMatchObject({
      from: SENDER,
      subject: "Mere Christianity is ready for you",
      to: ["budi@example.com"],
    });
  });

  it("skips when email is off or the key is missing", async () => {
    const budi = await insertUser();
    expect(await sendReadyEmails([notice(budi.id)])).toEqual(["skipped"]);
    await enableEmail();
    vi.stubEnv("RESEND_API_KEY", "");
    expect(await sendReadyEmails([notice(budi.id)])).toEqual(["skipped"]);
    expect(provider).not.toHaveBeenCalled();
  });

  it.each(["http", "network"])(
    "reports a failed delivery without throwing: %s",
    async (failure) => {
      await enableEmail();
      const budi = await insertUser();
      if (failure === "http") {
        provider.mockResolvedValue(Response.json({}, { status: 500 }));
      } else {
        provider.mockRejectedValue(new Error("offline"));
      }
      expect(await sendReadyEmails([notice(budi.id)])).toEqual(["failed"]);
    }
  );

  it("does nothing without holds", async () => {
    expect(await sendReadyEmails([])).toEqual([]);
    expect(provider).not.toHaveBeenCalled();
  });

  it("hands the emails to after() so the function lives until they're sent", async () => {
    await enableEmail();
    const budi = await insertUser();
    sendReadyEmailsLater([notice(budi.id)]);
    expect(later.tasks).toHaveLength(1);
    expect(provider).not.toHaveBeenCalled();
    await later.tasks[0]?.();
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("still sends, without waiting, outside a request", async () => {
    await enableEmail();
    const budi = await insertUser();
    later.inRequest = false;
    sendReadyEmailsLater([notice(budi.id)]);
    expect(later.tasks).toHaveLength(0);
    await vi.waitFor(() => expect(provider).toHaveBeenCalledTimes(1));
  });

  it("schedules nothing without holds", () => {
    sendReadyEmailsLater([]);
    expect(later.tasks).toHaveLength(0);
  });
});
