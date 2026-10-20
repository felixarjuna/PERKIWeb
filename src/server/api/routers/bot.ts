import { createTRPCRouter, protectedProcedure } from "../trpc";

/** Public address of perki.bot, the Discord birthday worker on Fly.io. */
export const DEFAULT_BOT_URL = "https://perki-bot.fly.dev";
const TIMEOUT_MS = 8000;

// Validated in env.mjs; read directly so tests need no full environment.
const botUrl = () => process.env.PERKI_BOT_URL || DEFAULT_BOT_URL;

export const botRouter = createTRPCRouter({
  /**
   * Whether perki.bot answers HTTP right now. A response means the worker
   * process is up; it does not prove today's birthday job has run.
   */
  status: protectedProcedure.query(async () => {
    const started = Date.now();
    try {
      const response = await fetch(botUrl(), {
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return {
        checkedAt: new Date(),
        latencyMs: Date.now() - started,
        online: response.ok,
      };
    } catch {
      return { checkedAt: new Date(), latencyMs: null, online: false };
    }
  }),
});
