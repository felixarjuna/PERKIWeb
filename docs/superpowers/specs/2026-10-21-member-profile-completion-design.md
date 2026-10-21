# Member profile completion

Date: 2026-10-21. Status: draft for owner review.

## Why

Many people have signed in with Google but never filled in the separate
member form at `/member/join`. Until they do, they have a `user` row but no
`profiles` row, and every staff view (`/admin/members`, the dashboard) reads
only `profiles`, so the fellowship can't see them at all.

The details exist for community care, not paperwork:

- **Birthday**: so the fellowship can celebrate them.
- **Phone (WhatsApp)**: so staff can keep in touch and add them to the
  WhatsApp group.
- **Where they live, address**: to know where members live.
- **Studies (major)**: to know what they study.

Today nothing leads people there: sign-in returns them to `/` or their
callback, the only nudge (`src/components/member-prompt.tsx`) disappears
forever once dismissed, and the join form is insert-only, so nobody can
correct their details later.

**Success:** most signed-in people end up with a complete profile, without
anyone feeling pushed or blocked, and staff can see who hasn't finished and
follow up.

## Goals

1. Ask every signed-in person without a profile once, right after sign-in,
   with a skippable welcome step.
2. Keep reminding gently (a reminder card that comes back, a dot on the
   Account tab) until the profile is complete.
3. One profile page, `/account`, where members see and edit everything at
   any time.
4. A WhatsApp group link, set by staff, shown to members with a complete
   profile.
5. Staff see every account, its profile state, and what's missing; the
   dashboard shows sign-ups and how many finished their profile.

## Non-goals

- Bio. It stays in the table but is not asked for or shown; it returns with
  a future shareable public profile page.
- Public/shareable profiles, member-to-member directory.
- Automatic WhatsApp invitations, messages, or birthday notifications.
- Changing email (still managed by Google).

## Anti-goals (would be a failure even if it works)

- Blocking any part of the app until the profile is done.
- A long or intimidating form; any field feeling mandatory to *save*.
- Exposing the WhatsApp link to signed-out visitors or putting it in
  public markup/the landing page.
- Exposing anyone's phone, address or birthday outside admin views and the
  member's own page.

## Definitions

- **Profile fields** (5): birthday, phone (WhatsApp), where you live
  (`location`), address, studies (`major`). Name comes from the account and
  is shown, but doesn't count toward completion.
- **Not started**: no `profiles` row.
- **Incomplete**: a `profiles` row with 1–4 of the five fields filled.
- **Complete**: all five filled (non-empty after trimming; birthday a valid
  date).
- Completion is computed from the data, never stored as a flag. One shared
  function (e.g. `profileCompletion(profile) → { filled, total, missing[] }`
  in `src/lib/`) is used by the member UI, nav dot, reminder, admin and
  dashboard so they never disagree.

## Member experience (decided)

Mobile-first (~390px). Mockups from the brainstorm are in
`.superpowers/brainstorm/` (not committed); the owner approved them.

### 1. Welcome step after sign-in

- Shown **once** to every signed-in person who has no profile and hasn't
  seen it yet, including existing accounts (they are the main target), not
  only brand-new sign-ups.
- Heading "Welcome, {first name}", one line on why ("A few details so we can
  care for you as a fellowship"), the five fields, each with a short
  why-line under it (birthday: "So we can celebrate with you"; phone: "So we
  can add you to the PERKI WhatsApp group").
- Actions: **Save and continue** (primary) and **Skip for now** (quiet).
  Both send them to where they were going (the original callback / return
  path; `/` if none).
- Saving with only some fields filled is allowed and creates the profile.
  No field is required to save; per-field validation still applies to what
  was entered (valid date, plausible phone via the existing `PhoneInput`).
- **When it appears (my call, from the owner's "they'd see it when opening
  the app"):** sessions last 30 days and renew on use, so regular members
  rarely sign in again. The step therefore appears on the person's **next
  visit to any app page** (pages rendered in `Template`: schedule,
  takeaway, prayers, group, account, …), not only right after a sign-in.
  The page they were opening is the return path.
- **Landing page (my call, from the standing preference that `/` is for
  newcomers and member prompts live on app pages):** `/` never redirects.
  But a sign-in whose return path would be `/` goes through the welcome
  step first (when it's due) and then lands on `/`, so signing in from the
  landing page still shows it right away.
- Never shown on admin pages or auth pages.

### 2. Reminder card on app pages

- Replaces today's `MemberPrompt` in the same slot of `template.tsx`.
- Shown to signed-in people whose profile isn't complete: "Your profile is
  2 of 5 done", progress bar, a sentence naming what's missing and why,
  **Finish my profile** (to `/account`) and **Remind me later**.
- "Remind me later" hides it for **7 days**, then it returns. It does not
  hide the nav dot.
- Hidden on `/account` and on the welcome step.

### 3. Dot on the Account tab

- The bottom nav's Account item (`src/components/home/navigation.tsx`) shows
  a small status dot while the profile isn't complete. It never snoozes.
- Accessible name includes the state, e.g. "Account, profile incomplete".
- Follows the existing corner-dot pattern used for the perki.bot status in
  the sidebar (no outline), using semantic tokens.

### 4. `/account` is the profile page

- Top: name, email ("signed in with Google"), progress "3 of 5" with a bar.
- **Summary list** (owner chose this over an always-open form): one row per
  field showing its value, or an "Add" chip when missing. Tapping a row opens
  a small editor for just that field (sheet/dialog on mobile), saving that
  field alone. Name stays editable here as today.
- Below: the **PERKI WhatsApp group** card. With a complete profile it shows
  a "Join the WhatsApp group" button (opens the link, `rel="noopener"`).
  Otherwise it shows the card disabled with "Unlocks once your profile is
  complete". Hidden entirely when staff haven't set a link.
- `/member/join` redirects to `/account` (keep the route so old links and
  the footer's "Become a member" still work; point the footer at `/account`
  or the sign-in flow).

## Staff experience (decided)

### `/admin/members`

- Lists **every account**, not only profile rows: accounts without a profile
  appear with name, email, photo and role, profile columns empty.
- New **Profile** column with a chip: **Complete**, **3 of 5**, or
  **Not started**.
- New **Profile** filter (Complete / Incomplete / Not started), using
  `AdminSelect`/`AdminSegmented` like the other facets, stored in the URL as
  `profile=<comma-separated values>`; resets pagination like the others.
  Document the parameter in CLAUDE.md's `/admin/members` list.
- Details sheet shows "Missing: phone, address" (or "Profile not started").
- Existing facets (location, birthday month) simply don't match accounts
  without those fields.

### `/admin/dashboard`

- Monthly chart counts **sign-ups** (account created, `user.createdAt`),
  labelled "New accounts", replacing the count of profile submissions.
- New **funnel card**: signed in → started a profile → complete, each step
  linking to `/admin/members` with the matching `profile` filter.
- **Known data caveat:** `user.createdAt` was added in migration `0006` with
  `DEFAULT now()`, so every account older than that migration carries the
  migration date. Those accounts must not appear as a spike in that month.
  Builder decides how (e.g. treat accounts whose `createdAt` equals the
  migration's backfill instant as undated, falling back to their
  `profiles.createdAt` if earlier); they are disclosed like today's
  "missing dates".
- Location scoping keeps working; accounts without a location only count in
  the unscoped view.

### Settings → Integrations

- New setting **WhatsApp group link** next to the Discord invite, stored in
  the `settings` table (new key in `SETTING_KEYS`, a validator like
  `discordInviteFrom` accepting `https://chat.whatsapp.com/<code>`).
  Staff-only to edit. Empty means the WhatsApp card is hidden.

## Server and data (decided)

- **Security:** the WhatsApp link is returned only by a `protectedProcedure`
  that also checks the caller's own profile is complete; it is never part of
  `siteLinks()` output used on public pages. Profile reads/writes for members
  only ever touch the caller's own row (user id from the session, never from
  input — drop `userId` from the input schema). The admin all-accounts
  query stays `adminProcedure` and never selects `hashedPassword`
  (`safeUserColumns`).
- **Profile write:** replace insert-only `addUserProfile` with an upsert of
  the caller's own profile accepting any subset of the five fields; empty
  string clears a field. Keep the old procedure name working or update all
  callers in the same PR.
- **Own profile read:** one query returning the caller's profile fields plus
  completion, used by `/account`, reminder and nav dot (replaces
  `hasOwnProfile`).
- **"Welcome seen":** stored on the account so it's once across devices,
  not per browser. A nullable timestamp column on `user` (e.g.
  `welcomeSeenAt`), set when the step is saved or skipped. Additive
  migration only, safe with the previous release.
- **Snooze:** "Remind me later" is stored per device (localStorage with a
  timestamp); losing it only means an early reminder.

## Constraints

- Follow CLAUDE.md: `Template` page rhythm, `type-*` roles, filled form
  controls, semantic tokens, `Button`/`buttonVariants`, sonner toasts,
  mobile-first.
- Migrations are additive and must work with the previous release;
  `pnpm db:generate` after rebasing.
- Tests: server tests (PGlite) for the upsert (own row only, partial saves,
  clearing), completion function unit tests, WhatsApp link gating, admin
  all-accounts query; dom/e2e for the welcome step (shown once, skip, return
  path), reminder snooze, nav dot, and the members filter.
- `pnpm check` passes.

## Left to the builder

- How the welcome check is wired (e.g. a server-side check in `Template`'s
  app pages plus the sign-in return-path rule above), as long as it's once
  per account, preserves the return path, adds no noticeable latency, and
  never runs on `/`, admin or auth pages.
- Whether the welcome step is its own route (e.g. `/welcome`) or a mode of
  `/account`.
- Exact copy beyond the lines quoted above, dot styling, editor component
  (sheet vs dialog), chip wording for the funnel.
- How to detect the `0006` backfill date (see caveat).
- Removing `MemberPrompt`'s old localStorage key.
