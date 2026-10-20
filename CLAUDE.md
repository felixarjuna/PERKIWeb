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
- Database (Drizzle Kit, PostgreSQL): `pnpm db:dev` / `pnpm db:dev:down` (local dev Postgres, `compose.dev.yml`, port 54320, persistent volume), `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`, `pnpm db:seed`
- Local development uses the Docker dev database (`.env.example` points there): `pnpm db:dev && pnpm db:migrate && pnpm db:seed`. Never point `.env` at production.
- **Production schema changes only through migrations, applied by CI.** `deploy:migrate` runs `pnpm db:migrate` against prod after every check passes on `main`. Never `db:push` to prod: an unrecorded change breaks later migrations (`drizzle.config.ts` and `seed.ts` refuse non-local hosts). Vercel deploys the same commit in parallel, so a migration must work with the previous release too: add columns/tables first, drop or rename in a later PR.
- drizzle applies only migrations newer than the last one recorded, so a migration generated on a branch before another migration landed on `main` is silently skipped. After rebasing onto a new migration, delete yours and re-run `pnpm db:generate`. `src/lib/db/migrations.test.ts` fails on out-of-order timestamps; `check:migrations` fails if `schema.ts` changed without a migration.

## Testing

Tests never touch a real database: integration tests use PGlite and e2e uses its own throwaway container.

- `pnpm test` (Vitest, `vitest.config.ts`) runs three projects; `pnpm test:unit` runs `unit` + `dom`, `pnpm test:integration` runs `server`:
  - `unit`: node, `src/**/*.test.ts` outside `src/server`.
  - `server`: tRPC routers against **PGlite** (in-process Postgres built from `src/lib/db/migrations`, truncated after each test). `src/test/setup-server.ts` mocks `~/server` and `~/server/auth`; call procedures with `callerFor(userId)` / `anonymousCaller()` from `src/test/caller.ts`.
  - `dom`: jsdom + Testing Library for `*.test.tsx`.
- `pnpm test:e2e:db` then `pnpm test:e2e` (Playwright, `e2e/`): builds and starts the app on :3100 against a throwaway Docker Postgres (`compose.test.yml`, port 54329, tmpfs). `e2e/global-setup.ts` recreates the schema from the migrations and seeds the `MEMBER` account; `auth.setup.ts` saves its signed-in state. `playwright.config.ts` refuses any non-local `DATABASE_URL`. Set `E2E_SKIP_BUILD=1` to reuse an existing build. Specs share one DB and run in parallel, so create data with `uniqueSuffix()`.
- Known gaps are pinned with `it.fails` / `test.fail()` and a `// BUG:` or `// SECURITY:` comment. Fixing the gap makes that test fail, so remove the marker when you fix it.
- Hand-written SQL in a migration must end each statement with `--> statement-breakpoint`, or fresh databases (tests, CI) can't apply it.
- CI (`.github/workflows/ci.yml`) runs on PRs and pushes to `main`. Jobs are named by stage (`check:lint`, `check:migrations`, `check:types`, `build`, `test:unit`, `test:integration`, `test:e2e`, `deploy:migrate`) and run in parallel. Ordering: `test:e2e` needs `build` (reuses the uploaded `.next` output, `E2E_SKIP_BUILD=1`); `deploy:migrate` runs only on pushes to `main`, after every check, in the `Production` GitHub environment (restricted to `main`, secret `DATABASE_URL`), and is never cancelled mid-run. Shared setup lives in `.github/actions/setup`. Vercel's GitHub integration deploys the app itself.

## Architecture

Path alias: `~/*` → `src/*`.

**Routing (App Router):** every route lives in `src/app/<route>/page.tsx`. Pattern used throughout: `page.tsx` is a server component that handles the `auth()` guard (redirect to `/auth/signin`) and static shell, and renders a co-located client component (`*-form.tsx`, `*-list.tsx`, `*-view.tsx`) for interactive parts. Shared page chrome is `src/components/template.tsx`.

**API layer (tRPC 11):** `src/server/api/root.ts` composes `appRouter` from routers in `src/server/api/routers/` — new routers must be registered there manually. `src/server/api/trpc.ts` defines `publicProcedure` and `protectedProcedure` (session-enforcing). **All mutations and sensitive queries must use `protectedProcedure`**; never select `users.hashedPassword` into a client-facing response (use the `safeUserColumns` pattern in `users.ts`). Zod input schemas live in `src/server/api/schema/schema.ts` (user schemas in `src/lib/db/schema/auth.ts`). HTTP handler: `src/app/api/trpc/[trpc]/route.ts` (fetch adapter).

**tRPC clients:** client components import `api` (and `RouterOutputs`) from `~/trpc/react` (provider mounted in `src/app/layout.tsx`); server components can use the RSC caller from `~/trpc/server`. The old `~/utils/api` (createTRPCNext) is gone.

**Database (Drizzle + postgres-js):** client in `src/server/index.ts` (`db`). **`src/lib/db/schema/schema.ts` is the single source of truth for all tables** (including NextAuth tables); `src/lib/db/schema/auth.ts` contains only zod validation schemas for user payloads. `drizzle.config.ts` points at `schema.ts`; migrations in `src/lib/db/migrations/`.

**Auth (NextAuth v5 beta / Auth.js):** `src/server/auth.ts` exports `{ handlers, auth, signIn, signOut }` from `NextAuth()` — Google OAuth + credentials (bcryptjs), JWT sessions, Drizzle adapter with explicit table map. Route handler: `src/app/api/auth/[...nextauth]/route.ts`. Use `await auth()` for session access in server components/route handlers. `next-auth` is in `transpilePackages` (next.config.mjs) to work around a beta ESM issue — don't remove it.

**Env vars:** validated in `src/env.mjs` (`@t3-oss/env-nextjs`) — add new vars to both the schema and `runtimeEnv`. Required: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_API_KEY`. Optional: `PERKI_BOT_URL` (perki.bot status check, defaults to the Fly.io app; e2e points it at a dead local port). Never hardcode secrets in scripts or source — this repo has had committed secrets before; both were removed and must stay out.

**Styling (Tailwind 4, CSS-first):** all theme tokens live in `src/styles/globals.css` — `@theme` blocks define the brand palette (`cream`, `light-green`, `green`, `dark-green`) and semantic tokens. There is no `tailwind.config.*`. The site ships a single dark-green theme; `.dark` mirrors `:root`. Fonts (`--font-satoshi`, `--font-reimbrandt`) are loaded via `next/font/local` in `src/app/layout.tsx`.

## Design system

General app pages, including the admin login, render inside `src/components/template.tsx`, which owns the page rhythm: one `max-w-2xl` centered column, `px-4`, `pt-28 sm:pt-36 pb-24`, centered serif title + muted subtitle, `mt-8 sm:mt-10` gap to content. Pages must not re-introduce their own max-widths, horizontal padding, or top margins. Sign-in and sign-up use a compact card with the same typography and colors. The admin workspace uses its own AdminShell: a stock shadcn sidebar in the sidebar-07 layout (icon-collapsible; keep the primitive's default spacing), with the perki.bot status in its footer, mobile navigation sheet, page heading and action slot. Overview lives at /admin/dashboard; the searchable member directory lives at /admin/members and uses one horizontally scrollable data table (member name pinned, on every screen size) and a read-only details sheet opened from the name. Every route has one main landmark linked by the shared skip link.

**Type scale:** `src/styles/globals.css` section 4 defines eleven fluid `type-*` roles (`type-display`, `type-title`, `type-heading`, `type-subheading`, `type-quote`, `type-figure` (sans stat values), `type-lead`, `type-body`, `type-body-sm`, `type-caption`, `type-eyebrow`). Use the role utility for anything a reader reads, never a raw `text-*` size plus breakpoints. Reimbrandt is display-only (never below `type-subheading`); body text is 16px on phones; captions never below 12px. Satoshi ships one weight (500) and synthesis is off, so `font-bold`/`font-light` have no effect on Satoshi text.

**Surfaces:** every surface stays in the green hue family (~169-174), differentiated by *elevation*, never by hue: one OKLCH ramp (hue locked ~183, chroma ~0.03): `background` L.22 → `card` L.27 → `popover` L.30 → `secondary` L.35 → `accent` L.42 (highlight only). **`primary` is the brand cream** so primary actions pop; the whole theme lives in one `:root` block in `globals.css` in canonical shadcn preset format (a ui.shadcn.com theme-editor export can be applied over it with `pnpm dlx shadcn@latest apply <code>`). Content card = `rounded-xl bg-card p-4 sm:p-6` with optional `hover:bg-accent/40`; chips/badges = `rounded-full bg-paper px-2 py-1 text-paper-foreground text-xs`; dialogs = `bg-card` (borderless — no `border` on overlay surfaces or cards); form controls keep their soft green outline (`--input`). Destructive actions use the `destructive` token, never raw red utilities.

**Actions:** always the `Button` component or `buttonVariants()` on a `Link` — never hand-rolled pill divs/links. Hierarchy: `default` = primary action, `secondary` = supporting, `ghost` = quiet (e.g. sign out). Icons inside buttons: `size-4`.

**Color rule:** components use **semantic tokens only** — `bg-background`, `text-foreground`, `bg-accent` (interactive green surfaces), `text-muted-foreground` (secondary/metadata text), `border-accent`, and `bg-paper`/`text-paper-foreground` (the landing page's inverted cream sections and chips). Do not add raw brand-scale values to components; extend the semantic tokens instead. `destructive` is the action fill; `destructive-text` is the lighter, readable validation text color. Input outlines use `input` and must contrast against both the page and card surfaces. The landing page (`src/app/page.tsx`, sections in `src/components/home/`) uses `Section` for its vertical sticky titles and alternates `background`/`paper` tones; its hero glow is pure CSS (`.hero-glow` in `globals.css`). New UI must be **mobile-first**: design for ~390px, then enhance with `sm:`/`md:` — most members use the site from their phones.

**UI:** shadcn/ui components in `src/components/ui/` (`components.json`, style "default", RSC). Toasts use **sonner** (`toast.success/error` from `"sonner"`; `<Toaster/>` mounted in the root layout) — the legacy Radix toast was removed. `cn()` helper in `src/lib/utils.ts`. Static content data (groups, pastors, events, name lists, the Discord invite) lives in `src/lib/data.tsx`.

## Workflow

- Branch from `main` and open a PR into `main`. Merged branches are deleted automatically.
- Work that resolves an issue must put `Closes #<n>` in the **PR description** (one line per issue; `.github/pull_request_template.md` has the slot). GitHub then closes the issue when the PR merges into `main`. A closing keyword in a commit message works too, but the PR description is where it's checked.
- The repo is public. Security problems are tracked in private draft security advisories, never in public issues, PRs or commit messages, until they're fixed.

## Gotchas

- `xs:` responsive classes were never a defined breakpoint and are inert; don't add new ones.
- The admin dashboard has a client-side passcode gate (zustand) *plus* a NextAuth session requirement.

## Admin workspace

- `src/components/admin/` owns navigation, shell, controls, member directory, registration/birthday overview, and dedicated schedule/takeaway/prayer management lists. Public reading components contain no management mutations.
- `/admin/members` URL parameters: `q`, `location` (comma-separated normalised keys), `sort` (`<column>.<asc|desc>`, default `name.asc`), `page`, `pageSize`, `member`.
- Data tables use `src/components/data-table/` — a tablecn/Dice UI data table ported to TanStack Table v9 and our Radix primitives (the upstream registry ships Base UI only, so don't `shadcn add` it). Column defs set `meta.label`; pinned columns stay opaque. Admin toolbars use `AdminSearch`/`AdminSelect`/`AdminSegmented` from `admin-controls.tsx` (filled `bg-secondary`, no outlines), never native `<select>`. Native History API updates integrate with Next.js search parameters; filters reset pagination. Details restore focus to the originating button or search on direct entry.
- Metrics count profile registrations, with `Europe/Berlin` month boundaries. Date-only birthdays use UTC calendar fields. Cumulative registrations include retained profiles only; missing dates are disclosed.
- Prayer migration `0008` adds `visibility`, private by default for existing and new rows. `/admin/prayers` handles review/edit/delete/publication. `/prayers` reads the explicit safe public projection; participant names are never sent by that endpoint. Signed-in acknowledgement uses a locked, idempotent server mutation plus a lookup returning only the current person's acknowledged IDs.
- `deploy:migrate` applies `0008` after merge; until it finishes, the new prayer pages can fail on the missing column (the previous release is unaffected). Development/testing must use the local dev or test database.
- The existing NextAuth session plus client passcode gate remain transitional. RBAC, role assignment, member journeys, and testimonies are separate projects.