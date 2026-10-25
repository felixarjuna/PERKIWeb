import { describe, expect, it, vi } from "vitest";

// jsdom can't load on Vercel's Node runtime (html-encoding-sniffer@7 is
// ESM-only). The router is part of appRouter, so if it needs jsdom at load
// time, every server function on the site fails, not just the import.
vi.mock("jsdom", () => {
  throw new Error("jsdom was loaded with the router");
});

describe("takeaway import router", () => {
  it("loads without jsdom, which only the import itself may need", async () => {
    await expect(import("./takeaway-import")).resolves.toHaveProperty(
      "takeawayImportRouter"
    );
  });
});
