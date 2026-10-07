/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.mjs");

/** @type {import("next").NextConfig} */
const config = {
  crossOrigin: "anonymous",
  /** Pin the root so a stray lockfile in a parent directory is ignored. */
  outputFileTracingRoot: import.meta.dirname,
  reactStrictMode: true,
  /**
   * next-auth v5 (beta) ships ESM that imports `next/server` without an
   * extension; bundling it avoids Node ESM resolution errors at runtime.
   */
  transpilePackages: ["next-auth"],
  turbopack: { root: import.meta.dirname },
};

export default config;
