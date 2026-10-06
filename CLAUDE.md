# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PERKIWeb is the platform for PERKI Aachen (a church fellowship): prayer requests, schedules, service takeaways, and member management. Next.js 16 **App Router** (`src/app/`), React 19, tRPC 11, NextAuth v5 (beta), Drizzle ORM, Tailwind CSS 4, shadcn/ui. Deployed on Vercel.

## Commands

Package manager is **pnpm**.

- `pnpm dev` — start dev server
- `pnpm build` — production build (Turbopack; set `SKIP_ENV_VALIDATION=1` to build without real env vars)
- `pnpm lint` / `pnpm format` — Biome check / check --write (ultracite presets, config in `biome.jsonc`; DB migrations are excluded)
- `pnpm typecheck` — `tsc --noEmit` (TypeScript 7)
- `pnpm check` — lint + typecheck + unit/integration tests; run before calling work done
- Database (Drizzle Kit, PostgreSQL): `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`, `pnpm db:seed`

## Testing

Tests never touch the real database (`.env` points at production Supabase).

- `pnpm test` (Vitest, `vitest.config.ts`) runs three projects:
  - `unit`: node, `src/**/*.test.ts` outside `src/server`.
  - `server`: tRPC routers against **PGlite** (in-process Postgres built from `src/lib/db/migrations`, truncated after each test). `src/test/setup-server.ts` mocks `~/server` and `~/server/auth`; call procedures with `callerFor(userId)` / `anonymousCaller()` from `src/test/caller.ts`.
  - `dom`: jsdom + Testing Library for `*.test.tsx`.
- `pnpm test:e2e:db` then `pnpm test:e2e` (Playwright, `e2e/`): builds and starts the app on :3100 against a throwaway Docker Postgres (`compose.test.yml`, port 54329, tmpfs). `e2e/global-setup.ts` recreates the schema from the migrations and seeds the `MEMBER` account; `auth.setup.ts` saves its signed-in state. `playwright.config.ts` refuses any non-local `DATABASE_URL`. Set `E2E_SKIP_BUILD=1` to reuse an existing build. Specs share one DB and run in parallel, so create data with `uniqueSuffix()`.
- Known gaps are pinned with `it.fails` / `test.fail()` and a `// BUG:` or `// SECURITY:` comment. Fixing the gap makes that test fail, so remove the marker when you fix it.
- Hand-written SQL in a migration must end each statement with `--> statement-breakpoint`, or fresh databases (tests, CI) can't apply it.
- CI (`.github/workflows/ci.yml`) runs `check` and `e2e` on pushes and PRs.

## Architecture

Path alias: `~/*` → `src/*`.

**Routing (App Router):** every route lives in `src/app/<route>/page.tsx`. Pattern used throughout: `page.tsx` is a server component that handles the `auth()` guard (redirect to `/auth/signin`) and static shell, and renders a co-located client component (`*-form.tsx`, `*-list.tsx`, `*-view.tsx`) for interactive parts. Shared page chrome is `src/components/template.tsx`.

**API layer (tRPC 11):** `src/server/api/root.ts` composes `appRouter` from routers in `src/server/api/routers/` — new routers must be registered there manually. `src/server/api/trpc.ts` defines `publicProcedure` and `protectedProcedure` (session-enforcing). **All mutations and sensitive queries must use `protectedProcedure`**; never select `users.hashedPassword` into a client-facing response (use the `safeUserColumns` pattern in `users.ts`). Zod input schemas live in `src/server/api/schema/schema.ts` (user schemas in `src/lib/db/schema/auth.ts`). HTTP handler: `src/app/api/trpc/[trpc]/route.ts` (fetch adapter).

**tRPC clients:** client components import `api` (and `RouterOutputs`) from `~/trpc/react` (provider mounted in `src/app/layout.tsx`); server components can use the RSC caller from `~/trpc/server`. The old `~/utils/api` (createTRPCNext) is gone.

**Database (Drizzle + postgres-js):** client in `src/server/index.ts` (`db`). **`src/lib/db/schema/schema.ts` is the single source of truth for all tables** (including NextAuth tables); `src/lib/db/schema/auth.ts` contains only zod validation schemas for user payloads. `drizzle.config.ts` points at `schema.ts`; migrations in `src/lib/db/migrations/`.

**Auth (NextAuth v5 beta / Auth.js):** `src/server/auth.ts` exports `{ handlers, auth, signIn, signOut }` from `NextAuth()` — Google OAuth + credentials (bcryptjs), JWT sessions, Drizzle adapter with explicit table map. Route handler: `src/app/api/auth/[...nextauth]/route.ts`. Use `await auth()` for session access in server components/route handlers. `next-auth` is in `transpilePackages` (next.config.mjs) to work around a beta ESM issue — don't remove it.

**Env vars:** validated in `src/env.mjs` (`@t3-oss/env-nextjs`) — add new vars to both the schema and `runtimeEnv`. Required: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_API_KEY`. Never hardcode secrets in scripts or source — this repo has had committed secrets before; both were removed and must stay out.

**Styling (Tailwind 4, CSS-first):** all theme tokens live in `src/styles/globals.css` — `@theme` blocks define the brand palette (`cream`, `light-green`, `green`, `dark-green`) and semantic tokens. There is no `tailwind.config.*`. The site ships a single dark-green theme; `.dark` mirrors `:root`. Fonts (`--font-satoshi`, `--font-reimbrandt`) are loaded via `next/font/local` in `src/app/layout.tsx`.

## Design system

All app pages (everything except the landing page and admin dashboard) render inside `src/components/template.tsx`, which owns the page rhythm: one `max-w-2xl` centered column, `px-4`, `pt-28 sm:pt-36 pb-24`, centered serif title + muted subtitle, `mt-8 sm:mt-10` gap to content. Pages must not re-introduce their own max-widths, horizontal padding, or top margins.

**Type scale (mobile-first, at most one `sm:` step):**
- Page title (Template only): `font-reimbrandt text-4xl sm:text-6xl`
- Section heading: `font-reimbrandt text-2xl tracking-wide sm:text-3xl`
- Card title: `font-reimbrandt text-lg tracking-wide sm:text-xl`
- Body: `text-sm sm:text-base` — never `text-xs` for content
- Meta/captions: sans (default font) `text-xs text-muted-foreground` — Reimbrandt is display-only, never below `text-lg`

**Surfaces:** every surface stays in the green hue family (~169-174), differentiated by *elevation*, never by hue: one OKLCH ramp (hue locked ~183, chroma ~0.03): `background` L.22 → `card` L.27 → `popover` L.30 → `secondary` L.35 → `accent` L.42 (highlight only). **`primary` is the brand cream** so primary actions pop; the whole theme lives in one `:root` block in `globals.css` in canonical shadcn preset format (a ui.shadcn.com theme-editor export can be applied over it with `pnpm dlx shadcn@latest apply <code>`). Content card = `rounded-xl bg-card p-4 sm:p-6` with optional `hover:bg-accent/40`; chips/badges = `rounded-full bg-paper px-2 py-1 text-paper-foreground text-xs`; dialogs = `bg-card` (borderless — no `border` on overlay surfaces or cards); form controls keep their soft green outline (`--input`). Destructive actions use the `destructive` token, never raw red utilities.

**Actions:** always the `Button` component or `buttonVariants()` on a `Link` — never hand-rolled pill divs/links. Hierarchy: `default` = primary action, `secondary` = supporting, `ghost` = quiet (e.g. sign out). Icons inside buttons: `size-4`.

**Color rule:** components use **semantic tokens only** — `bg-background`, `text-foreground`, `bg-accent` (interactive green surfaces), `text-muted-foreground` (secondary/metadata text), `border-accent`, and `bg-paper`/`text-paper-foreground` (the landing page's inverted cream sections and chips). The 7 remaining raw brand-scale values in `@theme` exist only for decorative gradients and status ping dots; do not add new scale values — extend the semantic ramp instead. New UI must be **mobile-first**: design for ~390px, then enhance with `sm:`/`md:` — most members use the site from their phones.

**UI:** shadcn/ui components in `src/components/ui/` (`components.json`, style "default", RSC). Toasts use **sonner** (`toast.success/error` from `"sonner"`; `<Toaster/>` mounted in the root layout) — the legacy Radix toast was removed. `cn()` helper in `src/lib/utils.ts`. Static content data (groups, pastors, events, name lists) lives in `src/lib/data.tsx`.

## Gotchas

- `xs:` responsive classes were never a defined breakpoint and are inert; don't add new ones.
- The christmas routes are a past-event feature kept for reference/reuse; the external RSVP API (`rsvp-perkiaachen.fly.dev`) may be offline.
- The admin dashboard has a client-side passcode gate (zustand) *plus* a NextAuth session requirement.
