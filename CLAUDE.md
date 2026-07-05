# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PERKIWeb is the platform for PERKI Aachen (a church fellowship): prayer requests, schedules, service takeaways, finance, and member management. Built on the T3 Stack (Next.js + tRPC + NextAuth + Drizzle + Tailwind), deployed on Vercel.

**Important:** This is Next.js 13 using the **Pages Router** (`src/pages/`), not the App Router. Do not use App Router APIs (server components, `app/` metadata API, etc.).

## Commands

Package manager is **yarn 1** (`yarn install`).

- `yarn dev` — start dev server
- `yarn build` — production build (set `SKIP_ENV_VALIDATION=1` to build without real env vars)
- `npx biome check src` / `npx biome check --write src` — lint/format (Biome with ultracite presets, config in `biome.jsonc`; the `yarn lint` script still points at `next lint` but Biome is the active linter)
- Database (Drizzle Kit, PostgreSQL): `yarn db:generate` (migrations), `yarn db:migrate`, `yarn db:push`, `yarn db:studio`, `yarn db:seed`

There is no test suite.

## Architecture

Path alias: `~/*` → `src/*`.

**API layer (tRPC v10):** `src/server/api/root.ts` composes the `appRouter` from routers in `src/server/api/routers/` (users, prayers, schedules, takeaways, finances, profiles). New routers must be registered manually in `root.ts`. `src/server/api/trpc.ts` defines `publicProcedure` and `protectedProcedure` (session-enforcing middleware). Zod input schemas live in `src/server/api/schema/schema.ts`. The client-side tRPC hooks come from `src/utils/api.ts` (uses superjson transformer). The only HTTP endpoints are `src/pages/api/trpc/` and `src/pages/api/auth/`.

**Database (Drizzle ORM + postgres-js):** The client is created in `src/server/index.ts` (`db`). Schema files live in `src/lib/db/schema/` — `schema.ts` (app tables) and `auth.ts` (NextAuth tables). `drizzle.config.ts` only points at `schema.ts`; migrations output to `src/lib/db/migrations/`. Prisma appears in dependencies but is legacy — Drizzle is the active ORM.

**Auth (NextAuth v4):** Configured in `src/server/auth.ts` with the Drizzle adapter and two providers: Google OAuth and credentials (bcrypt against the `users` table). The session callback copies `token.sub` to `session.user.id`. Use `getServerAuthSession` for server-side session access.

**Env vars:** Validated with `@t3-oss/env-nextjs` in `src/env.mjs` — new env vars must be added to both the schema and `runtimeEnv` there. Required: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `NOTION_SECRET`, `NEXT_PUBLIC_GOOGLE_API_KEY`.

**Notion integration:** Finance data is backed by a Notion database. Client in `src/lib/notion/notion.ts`, generated types/SDK in `src/lib/notion/` (via `notion-ts-client`, config in `notion-ts-client.config.json`).

**UI:** shadcn/ui components in `src/components/ui/` (config in `components.json`), feature components in `src/components/`, Tailwind config in `tailwind.config.ts`. `cn()` helper in `src/lib/utils.ts`.

## Linting rules

`.claude/CLAUDE.md`, `AGENTS.md`, `WARP.md`, and `GEMINI.md` are identical auto-generated dumps of the ultracite/Biome rule set. Don't edit them by hand — they mirror the Biome config. Notable enforced rules: no `any`, no non-null assertions, no `console`, no TS enums, `import type` for types, kebab-case filenames, arrow functions over function expressions.
