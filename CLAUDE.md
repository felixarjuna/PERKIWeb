# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PERKIWeb is the platform for PERKI Aachen (a church fellowship): prayer requests, schedules, service takeaways, and member management. Next.js 16 **App Router** (`src/app/`), React 19, tRPC 11, NextAuth v5 (beta), Drizzle ORM, Tailwind CSS 4, shadcn/ui. Deployed on Vercel.

## Commands

Package manager is **pnpm**.

- `pnpm dev` — start dev server
- `pnpm build` — production build (Turbopack; set `SKIP_ENV_VALIDATION=1` to build without real env vars)
- `pnpm lint` / `pnpm format` — Biome check / check --write (ultracite presets, config in `biome.jsonc`; generated Notion SDK and DB migrations are excluded)
- Database (Drizzle Kit, PostgreSQL): `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`, `pnpm db:seed`

There is no test suite.

## Architecture

Path alias: `~/*` → `src/*`.

**Routing (App Router):** every route lives in `src/app/<route>/page.tsx`. Pattern used throughout: `page.tsx` is a server component that handles the `auth()` guard (redirect to `/auth/signin`) and static shell, and renders a co-located client component (`*-form.tsx`, `*-list.tsx`, `*-view.tsx`) for interactive parts. Shared page chrome is `src/components/template.tsx`.

**API layer (tRPC 11):** `src/server/api/root.ts` composes `appRouter` from routers in `src/server/api/routers/` — new routers must be registered there manually. `src/server/api/trpc.ts` defines `publicProcedure` and `protectedProcedure` (session-enforcing). **All mutations and sensitive queries must use `protectedProcedure`**; never select `users.hashedPassword` into a client-facing response (use the `safeUserColumns` pattern in `users.ts`). Zod input schemas live in `src/server/api/schema/schema.ts` (user schemas in `src/lib/db/schema/auth.ts`). HTTP handler: `src/app/api/trpc/[trpc]/route.ts` (fetch adapter).

**tRPC clients:** client components import `api` (and `RouterOutputs`) from `~/trpc/react` (provider mounted in `src/app/layout.tsx`); server components can use the RSC caller from `~/trpc/server`. The old `~/utils/api` (createTRPCNext) is gone.

**Database (Drizzle + postgres-js):** client in `src/server/index.ts` (`db`). **`src/lib/db/schema/schema.ts` is the single source of truth for all tables** (including NextAuth tables); `src/lib/db/schema/auth.ts` contains only zod validation schemas for user payloads. `drizzle.config.ts` points at `schema.ts`; migrations in `src/lib/db/migrations/`.

**Auth (NextAuth v5 beta / Auth.js):** `src/server/auth.ts` exports `{ handlers, auth, signIn, signOut }` from `NextAuth()` — Google OAuth + credentials (bcryptjs), JWT sessions, Drizzle adapter with explicit table map. Route handler: `src/app/api/auth/[...nextauth]/route.ts`. Use `await auth()` for session access in server components/route handlers. `next-auth` is in `transpilePackages` (next.config.mjs) to work around a beta ESM issue — don't remove it.

**Env vars:** validated in `src/env.mjs` (`@t3-oss/env-nextjs`) — add new vars to both the schema and `runtimeEnv`. Required: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_API_KEY`. Never hardcode secrets in scripts or source — this repo has had committed secrets before; both were removed and must stay out.

**Styling (Tailwind 4, CSS-first):** all theme tokens live in `src/styles/globals.css` — `@theme` blocks define the brand palette (`cream`, `light-green`, `green`, `dark-green`) and semantic tokens. There is no `tailwind.config.*`. The site ships a single dark-green theme; `.dark` mirrors `:root`. Fonts (`--font-satoshi`, `--font-reimbrandt`) are loaded via `next/font/local` in `src/app/layout.tsx`.

**Color rule:** components use **semantic tokens only** — `bg-background`, `text-foreground`, `bg-accent` (interactive green surfaces), `text-muted-foreground` (secondary/metadata text), `border-accent`, and `bg-paper`/`text-paper-foreground` (the landing page's inverted cream sections and chips). Raw brand-scale classes (`green-400`, `light-green-100`, `*-default`, hex values) are reserved for decorative gradients and the live-status ping dots only. New UI must be **mobile-first**: design for ~390px, then enhance with `sm:`/`md:` — most members use the site from their phones.

**UI:** shadcn/ui components in `src/components/ui/` (`components.json`, style "default", RSC). Toasts use **sonner** (`toast.success/error` from `"sonner"`; `<Toaster/>` mounted in the root layout) — the legacy Radix toast was removed. `cn()` helper in `src/lib/utils.ts`. Static content data (groups, pastors, events, name lists) lives in `src/lib/data.tsx`.

## Gotchas

- `xs:` responsive classes were never a defined breakpoint and are inert; don't add new ones.
- The christmas routes are a past-event feature kept for reference/reuse; the external RSVP API (`rsvp-perkiaachen.fly.dev`) may be offline.
- The admin dashboard has a client-side passcode gate (zustand) *plus* a NextAuth session requirement.
