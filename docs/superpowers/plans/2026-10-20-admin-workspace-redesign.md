# Admin Workspace Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Turn the existing admin pages into a coherent, mobile-first church administration workspace with an informative overview and usable member directory.

**Architecture:** Keep the merged schedule/takeaway routes and mutations. Redesign the shared shell, separate overview from members, and provide dedicated management lists instead of reusing public reading layouts. Keep authentication unchanged and handle public prayer visibility explicitly.

**Tech Stack:** Installed Next.js App Router, React 19, TypeScript, Tailwind 4 semantic tokens, shadcn/Radix, tRPC, Drizzle, Luxon, Vitest, and Playwright.

**Spec:** `docs/superpowers/specs/2026-10-20-admin-workspace-design.md`

## Merged baseline and scope reconciliation

Start from `main` at `6a665cb` on `feat/admin-workspace-redesign`. PR #22 already moved schedule and takeaway management to `/admin`, added `AdminShell`, and retained the session plus passcode entry flow. Preserve that work. The old specification's relocation tasks are already satisfied for those domains; only restructure their presentation and add management search/filter/sort.

Prayers still use an authenticated public-site page and have no admin destination or visibility field. That part of the original spec remains outstanding. Do not assume existing prayer content was public.

## Global constraints

- Reuse green semantic surfaces, cream actions, Reimbrandt headings, and Satoshi body text; follow `globals.css` type/control roles.
- Support 320px and 390px phones, tablet, and 1440px desktop without horizontal document overflow.
- Maintain the server session requirement and existing admin gate; RBAC and member journeys/testimonies remain separate projects.
- Registration means profile creation, with calendar periods evaluated in `Europe/Berlin`.
- Member directory defaults to name ascending and 10 records per page; page sizes are 10, 25, and 50.
- Member details are read-only. No exports, bulk operations, profile edits, or member deletion.
- Existing/new prayers default to private; public responses omit participant names.
- Read the installed Next.js guides for layouts, navigation, and search parameters before implementation. Respect AGENTS.md and never verify against production data.

## Review focus

1. Direct URLs, reload, back/forward, and malformed query parameters must preserve a usable directory without redirect loops or hydration failures (Tasks 1–2).
2. Missing dates, case/whitespace differences in locations, and equal sort values must yield stable records and correct metrics (Tasks 2–3).
3. Long names, addresses, and notes must remain readable at 320px and inside a scrolling detail sheet (Tasks 2 and 6).
4. Empty results and failed queries must leave filters and retry controls usable; mutations must preserve entered data on failure (Tasks 2, 4–5).
5. Existing private prayers and signed-in participant names must never leak through the new anonymous reading endpoint (Task 5).

## Task 1: Shared admin navigation and page shell

**Files:** Modify `src/components/admin/admin-shell.tsx`, `src/components/app-sidebar.tsx`, `src/components/nav-main.tsx`, `src/components/nav-user.tsx`; create `src/components/admin/admin-navigation.ts`; test `e2e/admin-workspace.spec.ts`.

**Interfaces:** Export `adminNavigation` with Overview `/admin/dashboard`, Members `/admin/members`, Schedules `/admin/schedules`, Takeaways `/admin/takeaways`, Prayers `/admin/prayers`. Extend `AdminShell` to accept those section names plus an optional subtitle and action slot, preserving existing title and children callers.

- [x] Add browser assertions for active nested-route navigation, the visible page heading, and sidebar/content geometry; confirm the new destinations fail against the baseline.
- [x] Rebuild the sidebar identity, grouping, active state, website return link, and account area using existing semantic surfaces and accessible controls. Use the existing sidebar provider/sheet behavior where suitable; close mobile navigation after selecting a route.
- [x] Make the shell a full-width workspace with a restrained header, predictable title/action rhythm, and a bounded content column. Preserve gate callback handling and session guards; no public navigation overlay or member prompt inside admin.
- [x] Run the navigation assertions at desktop and phone sizes; verify keyboard opening/closing and focus return. Run typecheck and lint on changed files. Commit this task.

## Task 2: Member directory and details

**Files:** Create `src/app/admin/members/page.tsx`, `src/components/admin/members/member-directory.tsx`, `member-details.tsx`, `member-model.ts`, `member-model.test.ts`, and `member-directory.test.tsx`; revise or retire `src/components/dashboard/{data-table,columns,data-table-pagination,table-features}.tsx`/`.ts` and their old tests once no callers remain; update `e2e/admin.spec.ts` and `e2e/helpers.ts`.

**Interfaces:** Export `Member = RouterOutputs['profiles']['getUserProfiles'][number]`, `MemberSort`, and `MemberFilters`. Implement `getMemberLocations(members: Member[]): {value: string; label: string}[]`, `filterAndSortMembers(members: Member[], filters: MemberFilters): Member[]`, and `readMemberFilters(params: URLSearchParams): MemberFilters`. `MemberDirectory` consumes the existing query. `MemberDetails` accepts a member, open state, and controlled open-change callback.

- [x] Write failing helper tests for trimmed/case-insensitive name/email/phone search; combined location filtering; missing locations; ascending/descending name and registration; location sort; birthday month/day sort; missing dates last; and stable profile-ID tie-breaking.
- [x] Implement helpers with named constants and immutable sorting. Canonicalize location comparison with trimmed lowercase values and preserve readable labels. Validate query values and clamp pagination.
- [x] Add component/browser tests for search/filter/page-size resetting page 1, URL restoration, invalid member IDs, zero-result reset, query error/retry, and details closure restoring focus.
- [x] Implement URL state with `q`, `location`, `sort`, `page`, `pageSize`, and `member`. Use a server route boundary/Suspense as required by installed Next.js search-parameter docs. Keep query updates from resetting scroll or discarding unrelated query state.
- [x] Build a compact desktop table for name/email, location, birthday, registered date, and details. Provide equivalent mobile cards and one shared transform/pagination source. Move phone, major, address, and bio into the scrollable details sheet. Make email/phone links valid when present; show a clear fallback otherwise.
- [x] Update legacy admin tests to visit `/admin/members` after login and use labelled pagination controls. Retire tests for the replaced seven-column layout rather than preserving obsolete assertions.
- [x] Run helper/component tests, relevant browser cases, typecheck, and lint. Commit this task.

## Task 3: Community overview and birthday list

**Files:** Modify `src/app/admin/dashboard/dashboard-view.tsx`; create `src/components/admin/overview/{community-overview,registration-chart,birthday-list}.tsx`, `overview-model.ts`, and `overview-model.test.ts`.

**Interfaces:** `getCommunityOverview(members: Member[], options: {now: Date; month: string; location: string; range: 6 | 12})` returns scoped totals, monthly registrations, previous-month count, cumulative chart values, unrecorded-date count, and day-sorted birthdays. `CommunityOverview` owns controls and the complete profiles query, with pure helpers shared by display components.

- [x] Write failing tests for Berlin month boundaries, year rollover, leap-day birthdays, invalid/null dates, birthday order, equivalent locations, a zero previous-month count, and totals independent of directory pagination.
- [x] Implement metric helpers and explicitly label retained-profile cumulative counts. Avoid percentage claims when the previous period is zero; expose missing-date counts in explanatory copy.
- [x] Replace the old table dashboard with a real overview: restrained introduction, registration totals, monthly change, accessible six/twelve-month chart with textual values, and a complete selected-month birthday list. Apply location consistently and provide month selection. Link birthdays to `/admin/members?member=<profileId>`.
- [x] Provide initial loading, empty, failed/retry, and background-refresh states. Remove the unsupported bot status claim and decorative ping effects.
- [x] Run model tests and browser assertions for controls, member detail links, and overflow. Commit this task.

## Task 4: Schedules and takeaways as management screens

**Files:** Modify `src/app/admin/{schedules,takeaways}/page.tsx`; create `src/components/admin/content/{schedule-manager,takeaway-manager}.tsx`, `content-filters.ts`, and `content-filters.test.ts`; modify `src/server/api/routers/schedules.ts` and `schedules.test.ts` for deletion dependencies; adjust existing admin form files only for shell/action consistency.

**Interfaces:** `ScheduleManager` and `TakeawayManager` own existing list queries and mutations. Keep existing create/edit URLs, schemas, and successful save behavior. Reuse `AdminShell` action slot. Pure filtering helpers consume the existing router outputs.

- [x] Add failing tests for schedule title/speaker search, event type, upcoming/past/all, date direction, and takeaway title/content search with combined event filtering. Include zero matches while retaining filter controls.
- [x] Implement dedicated compact management lists with labelled search, filters, and sort. Default schedules to upcoming/earliest; takeaways to newest event date. Include explicit edit links and record-naming delete confirmation; retain mobile usability.
- [x] Add an integration test that deleting a schedule referenced by a takeaway fails without deleting either record. Implement the server dependency check and surface the actionable error in admin. Never add cascade deletion.
- [x] Normalize create/edit form spacing, pending/save/cancel actions, and error feedback within the new shell. Preserve batch schedule creation and existing validation. Remove unused management branches from public reading components after updating all callers.
- [x] Run filter tests, schedule integration tests, and affected CRUD browser tests. Verify public readers still work. Commit this task.

## Task 5: Prayer management and safe public reading

**Files:** Create `src/app/admin/prayers/page.tsx`, `src/components/admin/prayers/prayer-manager.tsx`; modify `src/lib/db/schema/schema.ts`, `src/server/api/schema/schema.ts`, `src/server/api/routers/prayers.ts`, `prayers.test.ts`, `src/app/prayers/page.tsx`, `prayer-wall.tsx`, and existing prayer form components; generate the Drizzle migration and metadata with the project command.

**Interfaces:** Add private/published prayer visibility defaulting to private. Keep authenticated `getPrayers` for admin; add public `getPublishedPrayers` returning only ID, content, safe author display, creation date, and aggregate count. Add authenticated `setPrayerVisibility({id, visibility})` with schema validation. Public reading never consumes the admin response.

- [x] Write failing integration tests for anonymous published-only access, legacy/new private defaults, anonymous author masking, absence of `prayerNames`, unauthenticated mutation rejection, and publication/unpublication results.
- [x] Generate and inspect the migration; apply it only in isolated tests. Implement explicit selected fields for public reads and preserve current mutation authentication.
- [x] Build an admin search/visibility/sort list with existing create/edit/delete behavior and real publish/return-to-private actions. Confirm destructive actions, keep input on mutation failure, and invalidate both reading and administrative queries after visibility changes.
- [x] Make `/prayers` anonymously readable using the safe query. Preserve signed-in submission and acknowledgement; offer return-aware sign-in for anonymous participation. Remove editing/deletion from the public presentation. Keep each person's acknowledgement state available only to that signed-in person through a separate authenticated lookup rather than returning the participant-name list publicly.
- [x] Run integration and prayer browser tests including a private-record fixture and publication changes. Commit this task.

## Task 6: Whole-workspace verification and documentation

**Files:** Update `e2e/admin-workspace.spec.ts`, affected `e2e/admin.spec.ts`, `e2e/prayers.spec.ts`, and content specs; update `CLAUDE.md` with final admin routes/component ownership and remaining RBAC boundary. Add design-system documentation only if a reusable token/control change was necessary.

- [x] Run `pnpm check` and `pnpm build`. Resolve failures introduced by this branch; record any proven pre-existing failures separately.
- [x] Run affected Playwright tests against the configured throwaway Docker database using the repository workflow, never the production `.env` database.
- [x] Inspect live desktop and 320px/390px mobile pages with T3 preview tools. Exercise sidebar/sheet keyboard behavior, URL back/forward, long member data, filter resets, failed-query recovery, and form scrolling. Capture screenshots and fix observed problems.
- [x] Verify public routes contain no management actions, admin data remains authenticated, and prayer publication boundaries match integration tests. Run final diff checks and update documentation; commit verification fixes.
- [x] Report the changed behavior, commands/results, screenshots, and remaining RBAC/member-journey work. Do not deploy or merge without the user's instruction.

## Execution recommendation

Implement directly in this session. The shell, member URL state, overview, and management lists share interfaces, so keeping them in one working context avoids repeated setup. No subagents are authorized by this plan alone. Review this plan before implementation, per the planning skill's handoff gate.

## Delivery record

Completed on `feat/admin-workspace-redesign` from `6a665cb`.

- Verification: `pnpm check` passed (201 tests, 2 existing expected failures); `pnpm exec playwright test --workers=4` passed all 106 tests and its production-build prerequisite. Browser coverage includes desktop and 320px/390px layouts, content CRUD, prayer publication, directory URL state and error recovery.
- Independent review found three functional issues: displayed Bible-study leader omitted from search, missing focus fallback for direct member links, and missing retry for acknowledgement lookup errors. Each was reproduced by a failing regression test, fixed, and verified with the full suite. Review notes about actionable contact links, name wrapping, and filter visibility during query errors were also addressed.
- Decisions: retained the explicitly requested feature branch in the current checkout; used shared pure member transforms with a native semantic table/mobile cards instead of redundant TanStack state; removed generated serial alterations after confirming the original migration already created serial IDs; added a private acknowledgement lookup and locked mutation to preserve public prayer participation without exposing participant lists. Directory/browser tests replace the retired legacy seven-column table tests.
- Integration: role enforcement and member journeys/testimonies remain separate. Prayer visibility migration must be applied during deployment; verification used only the local throwaway database. No production migration, push, merge, or deployment was performed.