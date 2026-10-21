# Member Profile Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lead every signed-in person to a complete member profile (welcome step, reminder, nav dot, editable `/account`), unlock the WhatsApp group link for complete profiles, and show staff every account with its profile state.

**Architecture:** One pure completion function in `src/lib/profile-completion.ts` drives every surface. The `profiles` router gains own-profile read/upsert, welcome tracking and the gated WhatsApp link; the admin directory switches from `profiles ⟕ users` to `users ⟕ profiles`, so `Member.profiles` becomes nullable. The welcome step is a `/welcome` route; a client `WelcomeGate` in `Template` sends due users there.

**Tech Stack:** Next.js 16 App Router, tRPC 11, Drizzle (PGlite in tests), react-hook-form + zod, TanStack Table v9, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-21-member-profile-completion-design.md`

## Global Constraints

- Profile fields, in this order everywhere: birthday, phone (WhatsApp), where you live (`location`), address, studies (`major`). Bio is never asked for or shown in member UI.
- Complete = all five non-empty after trim; birthday a valid date. Name doesn't count.
- No field is required to save. Empty string clears a field.
- User id always comes from the session, never from input.
- The WhatsApp link only leaves the server via a `protectedProcedure` that checks the caller's profile is complete; never in `siteLinks()`.
- Reminder snooze: 7 days, per device (localStorage). Nav dot never snoozes.
- `/`, `/admin/**`, `/auth/**`, `/welcome` never redirect to the welcome step.
- CLAUDE.md design system: `Template`, `type-*` roles, filled controls, semantic tokens only, `Button`/`buttonVariants`, sonner, mobile-first (~390px).
- Migration additive only, works with the previous release.

## Review Focus

1. A member with a profile row from the old join form (all five filled) → counts Complete; no welcome step, no reminder, no dot. (Task 2 test: existing complete profile → `welcomeDue` false.)
2. Whitespace-only values (`"  "`) → count as missing, not filled. (Task 1 test.)
3. Two simultaneous first saves → one profile row, no error. (Task 2 test: parallel `saveMine`.)
4. e2e accounts seeded without `welcomeSeenAt` would be bounced to `/welcome` and break unrelated specs → seed them as seen. (Task 6 step.)
5. Old `/admin/members?member=<profileId>` links → still open the right person. (Task 3 test: details lookup matches profile id or user id.)

---

### Task 1: Completion model

**Files:**
- Create: `src/lib/profile-completion.ts`
- Test: `src/lib/profile-completion.test.ts`

**Interfaces:**
- Produces:
  - `PROFILE_FIELDS = ["birthday", "phoneNumber", "location", "address", "major"] as const`; `type ProfileField`.
  - `profileFieldLabels: Record<ProfileField, string>` = Birthday, Phone, Where you live, Address, Studies.
  - `profileFieldReasons: Record<ProfileField, string>`: birthday "So we can celebrate with you", phoneNumber "So we can add you to the PERKI WhatsApp group", location "So we know where our members live", address "So we can reach you when it matters", major "So we know what you study".
  - `type ProfileValues = Partial<Record<ProfileField, string | Date | null>>`
  - `profileCompletion(profile: ProfileValues | null): { filled: number; total: 5; missing: ProfileField[]; state: "not-started" | "incomplete" | "complete" }` — `not-started` only when `profile` is null.

- [ ] **Step 1: Failing tests** — `null` → `{filled:0, missing: all five, state:"not-started"}`; `{}` → incomplete, filled 0; all five set → complete, missing `[]`; `phoneNumber: "  "` → missing `["phoneNumber"]`; `birthday: new Date("invalid")` → birthday missing; order of `missing` follows `PROFILE_FIELDS`.
- [ ] **Step 2:** `pnpm vitest run src/lib/profile-completion.test.ts` → FAIL (module missing).
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Same command → PASS.
- [ ] **Step 5:** Commit `feat(profile): completion model`.

### Task 2: Server — own profile, welcome tracking, WhatsApp setting

**Files:**
- Modify: `src/lib/db/schema/schema.ts` (users: `welcomeSeenAt: timestamp("welcomeSeenAt", { mode: "date", withTimezone: true })`, nullable)
- Create: migration via `pnpm db:generate` (expect `0016_*.sql`)
- Modify: `src/lib/settings.ts` (`SETTING_KEYS.whatsappGroupUrl = "whatsapp_group_url"`, `whatsappGroupFrom(input): string | null` accepting only `https://chat.whatsapp.com/<code>`)
- Modify: `src/server/api/schema/schema.ts` (replace `addProfileSchema` with `saveProfileSchema`: each of the five optional; strings trimmed, max 200; birthday `z.date().nullable()`; no `userId`; drop `bio`)
- Modify: `src/server/api/routers/profile.ts`, `src/server/api/routers/settings.ts`
- Test: `src/server/api/routers/profile.test.ts` (rewrite), `src/server/api/routers/settings.test.ts`, `src/lib/settings.test.ts` (create or extend)

**Interfaces:**
- Consumes: Task 1.
- Produces (tRPC, all `protectedProcedure` unless stated):
  - `profiles.mine` → `{ profile: { birthday: Date|null; phoneNumber; location; address; major: string|null } | null; completion: ReturnType<typeof profileCompletion>; welcomeDue: boolean }` where `welcomeDue = profile === null && welcomeSeenAt === null`.
  - `profiles.saveMine(input: SaveProfileInput)` → upsert own row (`onConflictDoUpdate` on `userId`, only the keys present; `""` → `null`), returns same shape as `mine`. Also sets `welcomeSeenAt` if null.
  - `profiles.markWelcomeSeen()` → sets `welcomeSeenAt = now()` if null.
  - `profiles.whatsappGroup()` → `{ url: string | null; unlocked: boolean; configured: boolean }`; `url` is null unless the caller's profile is complete and the setting is set.
  - `settings.integrations` gains `whatsappGroup: { url, updatedAt, updatedBy } | null`; `settings.setWhatsappGroup({ link })` (admin) with error "Paste a WhatsApp group invite link (chat.whatsapp.com/…)."
  - Remove `addUserProfile` and `hasOwnProfile` (callers replaced in Tasks 5 and 7).

- [ ] **Step 1: Failing tests (profile.test.ts):** `mine` for a new user → `{profile:null, completion.state:"not-started", welcomeDue:true}`; `saveMine({birthday})` creates a row with only birthday and `welcomeDue:false`; second `saveMine({phoneNumber:"+49 1"})` keeps the birthday; `saveMine({major:""})` clears major; `saveMine` writes only the caller's row (another user's row untouched); parallel `saveMine` ×2 → one row, both fulfilled; `markWelcomeSeen` → `welcomeDue:false` with no profile; a user with a full profile and `welcomeSeenAt` null → `welcomeDue:false`, state complete; `whatsappGroup` → `url:null, unlocked:false` for incomplete, the URL for complete once the setting is stored; anonymous caller → UNAUTHORIZED on `mine`/`saveMine`/`whatsappGroup`.
- [ ] **Step 2:** Failing tests for `whatsappGroupFrom` (accepts `https://chat.whatsapp.com/AbC123`, rejects `http://…`, `https://wa.me/…`, `https://chat.whatsapp.com/`) and `settings.setWhatsappGroup` (member → FORBIDDEN; bad link → BAD_REQUEST; `null` removes).
- [ ] **Step 3:** `pnpm vitest run --project server src/server/api/routers/profile.test.ts src/server/api/routers/settings.test.ts` and `pnpm vitest run src/lib/settings.test.ts` → FAIL.
- [ ] **Step 4:** Schema change, `pnpm db:generate`, implement routers and schema.
- [ ] **Step 5:** Same commands → PASS.
- [ ] **Step 6:** Commit `feat(profile): own profile upsert, welcome tracking, WhatsApp link`.

### Task 3: Admin member directory lists every account

**Files:**
- Modify: `src/server/api/routers/profile.ts` (`getUserProfiles` → `members`, admin-only: `from(users).leftJoin(profiles)`, select `user: {email,id,image,name,role,createdAt}` and `profiles` (nullable); never `hashedPassword`)
- Modify: `src/components/admin/members/member-model.ts`, `member-columns.tsx`, `member-details.tsx`, `member-role.tsx`, `member-directory.tsx`, `src/components/admin/overview/*.tsx` (nullable `profiles` → `profiles?.x`), `src/lib/utils.ts` if it reads the type
- Test: `member-model.test.ts`, `member-columns.test.tsx`, `profile.test.ts` (members query)

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `type Member = RouterOutputs["profiles"]["members"][number]` with `user` non-null and `profiles: Profile | null`.
  - `memberId(member) = member.user.id` (row id and `member=` URL value); `findMember(records, id)` matches `user.id` or `profiles?.id`.
  - `memberCompletion(member) = profileCompletion(member.profiles)`.
  - `MemberFilters.profile: ("complete" | "incomplete" | "not-started")[]`, URL `profile=` comma list; `profileOptions` labels Complete / Incomplete / Not started.
  - New column `id: "profile"` (after Role): chip text `Complete`, `3 of 5`, `Not started`; `filterFn: "arrHas"` on the state; sortable by `filled`.
  - Details sheet: line under the title — `Profile not started`, `Missing: phone, address` (labels lower-cased), or `Profile complete`. Bio row removed from member UI is not required here (staff may still see existing bio).

- [ ] **Step 1: Failing tests:** `members` returns an account with no profile (`profiles: null`) and never a `hashedPassword` key; model tests for `readMemberFilters("profile=incomplete,bogus")` → `["incomplete"]`, `memberFilterParams({profile:[]})` → `profile: ""`, `findMember` by profile id and by user id; columns test renders `Not started` and `3 of 5`.
- [ ] **Step 2:** Run `pnpm vitest run src/components/admin/members` and the server test → FAIL.
- [ ] **Step 3:** Implement; add a `DataTableFacetedFilter` titled "Profile" next to Role; filter resets page like the others.
- [ ] **Step 4:** Tests + `pnpm typecheck` → PASS.
- [ ] **Step 5:** Commit `feat(admin): member directory lists every account with profile state`.

### Task 4: Dashboard — new accounts and the profile funnel

**Files:**
- Modify: `src/components/admin/overview/overview-model.ts`, `community-overview.tsx`, `registration-chart.tsx` (labels), `registration-sheet.tsx`
- Test: create `src/components/admin/overview/overview-model.test.ts`

**Interfaces:**
- Consumes: Task 3 `Member`, Task 1.
- Produces:
  - `backfilledInstants(members): Set<number>` — any `createdAt` ms value (on `user` or `profiles`) shared by ≥2 records of that column is a migration backfill, not a real date.
  - `signedUpAt(member, backfill): Date | null` — earliest of `user.createdAt` and `profiles?.createdAt`, ignoring backfilled or invalid values.
  - `getCommunityOverview` buckets by `signedUpAt` (`missingDates` = accounts with null); returns `funnel: { accounts: number; started: number; complete: number }` over the location scope.
  - Tiles: "Accounts" (total), "New in {month}", "Birthdays"; chart copy says "New accounts".
  - Funnel card: three steps, each a `Link` to `/admin/members?profile=…` (accounts → no filter; started → `incomplete,complete`; complete → `complete`).

- [ ] **Step 1: Failing tests:** three accounts sharing `2026-01-05T10:00:00.123Z` and one at `2026-03-02` → backfill set has the shared instant, the three are undated unless their profile has a real earlier date, March bucket counts 1; funnel counts `{accounts:4, started:2, complete:1}` for a fixture with two profiles, one complete.
- [ ] **Step 2:** `pnpm vitest run src/components/admin/overview` → FAIL.
- [ ] **Step 3:** Implement and render the funnel card below the tiles (`rounded-xl bg-card p-4 sm:p-6`).
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(admin): dashboard counts new accounts and the profile funnel`.

### Task 5: `/account` profile page

**Files:**
- Create: `src/app/account/profile-summary.tsx` (client), `src/app/account/profile-field-editor.tsx` (client), `src/app/account/whatsapp-card.tsx` (client), `src/components/profile-field-input.tsx` (shared input per field, also used by Task 6)
- Modify: `src/app/account/page.tsx`, `src/app/account/account-form.tsx` (keep name editing; becomes the "Name" row source or stays above the list), `src/app/member/join/page.tsx` (→ `redirect("/account")`), delete `src/app/member/join/join-form.tsx`, `src/components/home/footer.tsx` (link to `/account`)
- Test: `src/app/account/profile-summary.test.tsx`

**Interfaces:**
- Consumes: Task 1 labels/reasons, Task 2 `profiles.mine`, `saveMine`, `whatsappGroup`.
- Produces: `ProfileFieldInput({ field, value, onChange, id })` — date input for birthday (UTC midnight as today), `PhoneInput` for phone, `Input` otherwise.

Layout (top to bottom inside `Template title="Your profile"`): email line ("Signed in with Google"), progress card ("3 of 5" + bar, `role="progressbar"` with `aria-valuenow`), card with name row + five rows (label, value or "Add" chip; whole row a button opening the editor `Dialog` with the field's reason as description, Save/Cancel), WhatsApp card (hidden when `configured` false; disabled text "Unlocks once your profile is complete" when locked; `Button` link with `target="_blank" rel="noopener noreferrer"` when unlocked), then existing `AccountActions`.

- [ ] **Step 1: Failing dom test:** with mocked `api` returning a profile missing phone, summary shows "4 of 5" and an "Add" button for Phone; clicking it opens a dialog with "So we can add you to the PERKI WhatsApp group".
- [ ] **Step 2:** `pnpm vitest run src/app/account` → FAIL.
- [ ] **Step 3:** Implement; invalidate `profiles.mine` and `profiles.whatsappGroup` on save; toast success/error.
- [ ] **Step 4:** PASS, `pnpm typecheck`.
- [ ] **Step 5:** Commit `feat(account): profile page with completion and WhatsApp link`.

### Task 6: Welcome step and gate

**Files:**
- Create: `src/app/welcome/page.tsx` (server), `src/app/welcome/welcome-form.tsx` (client), `src/components/welcome-gate.tsx` (client)
- Modify: `src/components/template.tsx` (render `<WelcomeGate />`), `src/app/auth/signin/sign-in-form.tsx` (when `callbackUrl === "/"`, `redirectTo: "/welcome"`), `e2e/global-setup.ts` (seed MEMBER and ADMIN with `welcomeSeenAt`)
- Test: `src/components/welcome-gate.test.tsx`, `src/app/auth/signin/sign-in-form.test.tsx`

**Interfaces:**
- Consumes: Task 2 `mine`, `saveMine`, `markWelcomeSeen`; Task 5 `ProfileFieldInput`.
- Produces: `/welcome?callbackUrl=<path>`; `welcomePath(returnPath: string): string` in `src/lib/auth-redirect.ts`.

Behaviour: page requires sign-in; if `welcomeDue` false → `redirect(getReturnPath(callbackUrl))`. Form: "Welcome, {first name}", the subtitle line from the spec, five `ProfileFieldInput`s with reasons; **Save and continue** calls `saveMine` with the non-empty fields (or `markWelcomeSeen` if none) then `router.replace(returnPath)`; **Skip for now** (`variant="ghost"`) calls `markWelcomeSeen` then navigates. `WelcomeGate`: when signed in, `mine.data?.welcomeDue` and pathname not `/`, `/welcome`, `/admin…`, `/auth…` → `router.replace(welcomePath(current path+search))`.

- [ ] **Step 1: Failing tests:** gate redirects on `/schedule` when due, not on `/` or `/admin/members`, not when `welcomeDue` false; sign-in form passes `redirectTo: "/welcome"` for no callback and the callback unchanged otherwise.
- [ ] **Step 2:** `pnpm vitest run src/components/welcome-gate.test.tsx src/app/auth/signin` → FAIL.
- [ ] **Step 3:** Implement; seed e2e accounts with `welcomeSeenAt: new Date()`.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(profile): welcome step for people without a profile`.

### Task 7: Reminder card and Account-tab dot

**Files:**
- Create: `src/components/profile-reminder.tsx`
- Delete: `src/components/member-prompt.tsx`
- Modify: `src/components/template.tsx`, `src/components/home/navigation.tsx`
- Test: `src/components/profile-reminder.test.tsx`, navigation test (create `src/components/home/navigation.test.tsx` if none)

**Interfaces:**
- Consumes: Task 1, Task 2 `mine`.
- Produces: `SNOOZE_KEY = "perki:profile-reminder-snoozed-until"`, `SNOOZE_DAYS = 7`.

Reminder: `<aside aria-label="Complete your profile">` in MemberPrompt's slot; hidden when signed out, complete, on `/account` or `/welcome`, or snoozed; text "Your profile is {filled} of 5 done", bar, sentence naming missing fields' reasons (first two), `Finish my profile` (`buttonVariants` link to `/account`), `Remind me later` (ghost; stores `Date.now() + 7d`). Remove the old `perki:member-prompt-dismissed` key on mount. Nav: when signed in and state ≠ complete, a dot on the Account tile (`absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary`, no ring) and the button's accessible name becomes "Account, profile incomplete".

- [ ] **Step 1: Failing tests:** reminder shows "3 of 5" when incomplete; hidden when complete; "Remind me later" hides it and stores a timestamp ~7 days out; shows again when the stored time is past; nav button named "Account, profile incomplete" when incomplete and "Account" when complete.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(profile): reminder card and Account-tab dot`.

### Task 8: WhatsApp setting UI, e2e, docs

**Files:**
- Modify: `src/components/admin/settings/integration-settings.tsx` (row "WhatsApp group" after Discord, reusing `LinkDialog`; placeholder `https://chat.whatsapp.com/…`; remove clears it)
- Modify/replace e2e: `e2e/member-join.spec.ts` → `e2e/profile.spec.ts` (fresh account: welcome step shown on `/schedule`, skip returns to `/schedule`; `/account` edit phone saves; `/member/join` redirects to `/account`), `e2e/member-prompt.spec.ts` (new reminder wording + snooze), fix `admin.spec.ts`, `auth.spec.ts`, `interface.spec.ts`, `smoke.spec.ts` references to the join form/prompt
- Modify: `CLAUDE.md` (`/admin/members` gains `profile`; Admin workspace bullet on profile completion, welcome step, migration 0016 deploy window; settings now include WhatsApp; metrics count accounts)

- [ ] **Step 1:** Implement settings row; `pnpm vitest run src/components/admin/settings` if tests exist.
- [ ] **Step 2:** Update e2e specs; `pnpm test:e2e:db && pnpm test:e2e` → PASS (if Docker is unavailable, record that and rely on `pnpm check` + `pnpm build`).
- [ ] **Step 3:** Update CLAUDE.md.
- [ ] **Step 4:** `pnpm check` and `SKIP_ENV_VALIDATION=1 pnpm build` → PASS.
- [ ] **Step 5:** Commit `feat(settings): WhatsApp group link; docs and e2e for profile completion`.
