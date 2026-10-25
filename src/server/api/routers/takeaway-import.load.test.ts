import { describe, expect, it, vi } from "vitest";

// jsdom can't load on Vercel's Node runtime (its dependencies require() ES
// modules). The router is part of appRouter, so if it ever needs jsdom again,
// every server function on the site fails, not just the import.
vi.mock("jsdom", () => {
  throw new Error("jsdom was loaded with the router");
});

/** A cold import transforms the router and happy-dom, which can take seconds. */
const COLD_IMPORT_TIMEOUT = 30_000;

describe("takeaway import router", () => {
  it(
    "loads without jsdom",
    async () => {
      await expect(import("./takeaway-import")).resolves.toHaveProperty(
        "takeawayImportRouter"
      );
    },
    COLD_IMPORT_TIMEOUT
  );
});
