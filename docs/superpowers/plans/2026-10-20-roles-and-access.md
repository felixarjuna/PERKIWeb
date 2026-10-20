# Roles and Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Owner, mita, writer and member roles that mita can manage in the admin workspace, with writers limited to their own takeaways, a role column and filter in the member table, a role-change history and a Drive quick link.

**Architecture:** `user.role` becomes `text` with a CHECK constraint (from the `user_role` enum) so new values can be written in the same migration. A partial unique index allows at most one owner. All permission rules live in `src/server/authz.ts` (DB-read per request, as in #28) and are enforced in tRPC procedures and server page guards. Role changes go through one transactional mutation that also writes `role_changes`. Takeaways gain `authorId`. Pages pass the viewer's role to `AdminShell`, which filters the sidebar.

**Tech Stack:** Next.js 16 App Router, tRPC 11, Drizzle ORM + drizzle-kit (Postgres), NextAuth v5, TanStack Table v9 (`src/components/data-table/`), Vitest (unit/dom/server with PGlite), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-20-roles-and-access-design.md`

## Global Constraints

- Branch `feat/roles`, created from `feat/admin-workspace-redesign` (PR #26 is not merged yet), in its own worktree under `.claude/worktrees/` (never in the main checkout). Rebase onto `main` once #26 merges.
- Roles, exactly: `owner`, `mita`, `writer`, `member` (default `member`). The legacy value `admin` stays **valid and means mita** until a later cleanup PR, because the previous release still checks `role === "admin"` during the deploy window.
- At most one `owner`, enforced by a partial unique index. No code path may set, change or remove `owner`.
- Every permission check reads the role from the database (`src/server/authz.ts`), never from the session token or the client.
- Each migration must keep the previous release working (CI applies it while Vercel deploys). Hand-written SQL statements end with `--> statement-breakpoint`.
- No member names, emails or IDs in committed files (public repo), except e2e fixtures with `@e2e.test` addresses.
- The Drive URL is a **server-only** env var `DRIVE_FOLDER_URL` (validated optional URL in `src/env.mjs`). It never reaches the client unless the viewer is owner or mita.
- UI follows `CLAUDE.md`'s design system: `AdminSelect`, `DataTableFacetedFilter`, shadcn Tooltip, `type-*` roles, semantic tokens, mobile-first.
- `pnpm check` and `pnpm test:e2e` pass at the end of every task that touches their scope.

## Review Focus

1. **A mita targeting the owner via the API directly** (not the UI), including setting someone else *to* owner. Expect FORBIDDEN, no row change, no history row. Task 2 adds the test.
2. **Two mita changing the same person's role at once.** Expect both histories recorded in order and the final role equal to the later change, with no lost history. Task 2 locks the row (`for("update")`) and adds a concurrent test.
3. **A writer opening another writer's takeaway edit URL directly** (`/admin/takeaways/<id>/edit`). Expect a 404 page, not a form whose save fails. Task 3 adds a server-page test via e2e in Task 7.
4. **A legacy `admin` row after this release.** Expect it to behave exactly like `mita` everywhere (guards, sidebar, role filter label "Mita"). Task 1 adds the normalization test.
5. **Revoking a role while the person has the admin workspace open.** Expect their next request to fail closed (FORBIDDEN/404) without needing a new sign-in. Task 2 adds a test that `isAdmin` is false right after `setRole(..., "member")`.

---

### Task 1: Role model, migration and permission helpers

**Files:**
- Modify: `src/lib/db/schema/schema.ts` (users.role, new `roleChanges` table, `takeaways.authorId`)
- Create: `src/lib/db/migrations/0010_*.sql` (+ snapshot/journal via `pnpm db:generate`)
- Modify: `src/server/authz.ts`
- Create: `src/lib/roles.ts` (pure, shared by client and server)
- Test: `src/lib/roles.test.ts`, `src/server/authz.test.ts` (server project)

**Interfaces:**
- Produces (`src/lib/roles.ts`):
  - `export const ROLES = ["owner", "mita", "writer", "member"] as const; export type Role = (typeof ROLES)[number];`
  - `export const ASSIGNABLE_ROLES = ["mita", "writer", "member"] as const;`
  - `export const roleLabels: Record<Role, string>` = `{ owner: "Owner", mita: "Mita", writer: "Writer", member: "Member" }`
  - `export function normalizeRole(stored: string | null | undefined): Role` (`"admin"` → `"mita"`, unknown/null → `"member"`)
  - `export const isStaffRole = (role: Role) => role === "owner" || role === "mita";`
  - `export const canWriteTakeaways = (role: Role) => isStaffRole(role) || role === "writer";`
  - `export function canChangeRole(actor: Role, target: Role, next: Role): boolean` (true only if `isStaffRole(actor)`, `target !== "owner"` and `next` is in `ASSIGNABLE_ROLES`)
- Produces (`src/server/authz.ts`): `getRole(userId: string): Promise<Role>`, `isAdmin(userId): Promise<boolean>` (= staff: owner or mita), `canManageTakeaways(userId): Promise<boolean>`, `requireAdmin(returnPath): Promise<{ session: Session; role: Role }>`, `requireTakeawayAccess(returnPath): Promise<{ session: Session; role: Role }>` (staff or writer, same redirect/404 rules as `requireAdmin`).
- Schema: `users.role: text("role").default("member").notNull()` with CHECK `role in ('owner','mita','writer','member','admin')` and unique index `user_single_owner` on `(role) where role = 'owner'`. `roleChanges` = `role_changes(id serial pk, userId text fk user ON DELETE CASCADE not null, changedById text fk user ON DELETE SET NULL, fromRole text not null, toRole text not null, createdAt timestamptz default now())`. `takeaways.authorId: text fk user ON DELETE SET NULL` (nullable).

- [ ] **Step 1: Write the failing tests**

`src/lib/roles.test.ts`:
```ts
it("treats the legacy admin value as mita and defaults to member", () => {
  expect(normalizeRole("admin")).toBe("mita");
  expect(normalizeRole("owner")).toBe("owner");
  expect(normalizeRole(null)).toBe("member");
  expect(normalizeRole("superuser")).toBe("member");
});
it("lets staff assign mita, writer and member, but never touch the owner", () => {
  expect(canChangeRole("mita", "member", "mita")).toBe(true);
  expect(canChangeRole("owner", "mita", "writer")).toBe(true);
  expect(canChangeRole("mita", "owner", "member")).toBe(false);
  expect(canChangeRole("mita", "member", "owner")).toBe(false);
  expect(canChangeRole("owner", "member", "owner")).toBe(false);
  expect(canChangeRole("writer", "member", "writer")).toBe(false);
  expect(canChangeRole("member", "member", "mita")).toBe(false);
});
```
`src/server/authz.test.ts` (server project):
```ts
it("reads roles from the database, with admin meaning mita", async () => {
  const legacy = await insertUser({ role: "admin" });
  const writer = await insertUser({ role: "writer" });
  expect(await getRole(legacy.id)).toBe("mita");
  expect(await isAdmin(legacy.id)).toBe(true);
  expect(await isAdmin(writer.id)).toBe(false);
  expect(await canManageTakeaways(writer.id)).toBe(true);
});
it("allows only one owner", async () => {
  await insertUser({ role: "owner" });
  await expect(insertUser({ role: "owner" })).rejects.toThrow();
});
it("rejects unknown role values", async () => {
  await expect(insertUser({ role: "superuser" as never })).rejects.toThrow();
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm exec vitest run src/lib/roles.test.ts src/server/authz.test.ts`
Expected: FAIL (module `~/lib/roles` not found / `getRole` not exported).

- [ ] **Step 3: Implement `src/lib/roles.ts`, the schema change and the authz helpers**

Change `users.role` to `text` + CHECK + partial unique index (drizzle `check()` and `uniqueIndex().on(t.role).where(sql\`role = 'owner'\`)` in the table's extra config). Remove `userRoleEnum`/`UserRole` exports and update their importers to `Role` from `~/lib/roles`. Add `roleChanges` and `takeaways.authorId`. `isAdmin`'s doc comment says "owner or mita"; `requireAdmin` now returns `{ session, role }`, so update its 9 call sites to destructure.

- [ ] **Step 4: Generate the migration and check it**

Run: `pnpm db:generate --name roles`
Expected: `0010_roles.sql` containing `ALTER COLUMN "role" SET DATA TYPE text`, the default, CHECK, unique index, `role_changes` table and `takeaways.authorId` FK. It must **not** update any rows. If drizzle-kit emits `DROP TYPE "user_role"`, keep it as the last statement. Every statement must end with `--> statement-breakpoint`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm typecheck && pnpm exec vitest run src/lib/roles.test.ts src/server/authz.test.ts src/lib/db/migrations.test.ts && pnpm test`
Expected: all PASS (the existing server suites still pass with `role: "admin"` test users).

- [ ] **Step 6: Commit**

```bash
git add src/lib/roles.ts src/lib/roles.test.ts src/lib/db src/server/authz.ts src/server/authz.test.ts src/app/admin
git commit -m "feat(roles): owner, mita, writer roles with one-owner constraint"
```

---

### Task 2: Role management API with history

**Files:**
- Create: `src/server/api/routers/roles.ts`, `src/server/api/routers/roles.test.ts`
- Modify: `src/server/api/root.ts` (register `roles`), `src/server/api/schema/schema.ts` (`setRoleSchema`), `src/server/api/routers/profile.ts` (`getUserProfiles` adds `user.role`)

**Interfaces:**
- Consumes: `canChangeRole`, `normalizeRole`, `Role`, `ASSIGNABLE_ROLES` (Task 1); `getRole` (Task 1).
- Produces:
  - `setRoleSchema = z.object({ role: z.enum(ASSIGNABLE_ROLES), userId: z.string().min(1) })`
  - `roles.setRole` (adminProcedure, mutation) → `{ role: Role }`. Errors: NOT_FOUND (no such user), FORBIDDEN (`canChangeRole` false), no-op returns the current role without a history row.
  - `roles.getHistory` (adminProcedure, query, input `{ userId: string }`) → `{ changedByName: string | null; createdAt: Date; fromRole: Role; toRole: Role }[]`, newest first.
  - `roles.myRole` (protectedProcedure, query) → `Role`.
  - `profiles.getUserProfiles` rows gain `user.role: Role` (normalized server-side).

- [ ] **Step 1: Write the failing tests** (`roles.test.ts`, using `insertUser({ role })` + `callerFor`)

```ts
it("lets a mita make a member a writer and records who did it", async () => {
  const mita = await insertUser({ name: "Mia", role: "mita" });
  const member = await insertUser();
  await callerFor(mita.id).roles.setRole({ role: "writer", userId: member.id });
  expect(await getRole(member.id)).toBe("writer");
  expect(await callerFor(mita.id).roles.getHistory({ userId: member.id })).toEqual([
    expect.objectContaining({ changedByName: "Mia", fromRole: "member", toRole: "writer" }),
  ]);
});
it("never changes the owner, or makes anyone owner, even through the API", async () => {
  const mita = await insertUser({ role: "mita" });
  const owner = await insertUser({ role: "owner" });
  await expect(callerFor(mita.id).roles.setRole({ role: "member", userId: owner.id }))
    .rejects.toMatchObject({ code: "FORBIDDEN" });
  await expect(callerFor(mita.id).roles.setRole({ role: "owner" as never, userId: mita.id }))
    .rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(await getRole(owner.id)).toBe("owner");
  expect(await testDb.select().from(roleChanges)).toEqual([]);
});
it("rejects writers and members", async () => { /* writer and member callers get FORBIDDEN */ });
it("revokes access on the very next request", async () => {
  // mita A demotes mita B to member; B's next roles.getHistory call → FORBIDDEN
});
it("keeps every history row when two mita change one person at once", async () => {
  // Promise.all([A sets writer, B sets mita]) → 2 history rows; final role = toRole of the later row
});
it("shows the role in the member directory", async () => {
  // getUserProfiles row for a legacy "admin" user has user.role === "mita"
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run --project server src/server/api/routers/roles.test.ts`
Expected: FAIL (`roles` not on the router).

- [ ] **Step 3: Implement `roles.ts`**

`setRole` runs in `db.transaction`: select the target with `.for("update")`, compute `canChangeRole(actorRole, normalizeRole(target.role), input.role)`, update `users.role`, insert a `role_changes` row with `changedById = ctx.session.user.id`. Read the actor's role with `getRole` inside the transaction. `getHistory` left-joins `users` on `changedById` for the name.

- [ ] **Step 4: Run tests**

Run: `pnpm typecheck && pnpm exec vitest run --project server`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/api
git commit -m "feat(roles): setRole and history, owner protected server-side"
```

---

### Task 3: Takeaway authorship and writer access

**Files:**
- Modify: `src/server/api/trpc.ts` (add `takeawayProcedure`), `src/server/api/routers/takeaway.ts`, `src/server/api/routers/takeaway.test.ts`
- Modify: `src/components/admin/content/takeaway-manager.tsx` (use `getManageable`, show Edit/Delete only when `canManage`)
- Modify: `src/app/admin/takeaways/page.tsx`, `src/app/admin/takeaways/new/page.tsx`, `src/app/admin/takeaways/[id]/edit/page.tsx` (use `requireTakeawayAccess`; the edit page calls `notFound()` unless the viewer can manage that takeaway)

**Interfaces:**
- Consumes: `canManageTakeaways`, `isAdmin`, `requireTakeawayAccess` (Task 1).
- Produces:
  - `takeawayProcedure`: protected + `canManageTakeaways`, else FORBIDDEN.
  - `takeaways.addTakeaway` (takeawayProcedure) sets `authorId = ctx.session.user.id`.
  - `takeaways.updateTakeaway` / `deleteTakeaway` (takeawayProcedure): allowed if staff, or `authorId === viewer`; else FORBIDDEN; missing → NOT_FOUND.
  - `takeaways.getManageable` (takeawayProcedure, query) → same rows as `getTakeaways` plus `canManage: boolean`; `authorId` never returned.
  - `canManageTakeaway(takeawayId: number, userId: string): Promise<boolean>` exported from `takeaway.ts` for the edit page.

- [ ] **Step 1: Write the failing tests** (`takeaway.test.ts`)

```ts
it("lets a writer add a takeaway for any schedule and credits them", ...);           // authorId = writer.id
it("lets a writer edit and delete only their own takeaways", ...);                    // other writer's → FORBIDDEN, row unchanged
it("lets mita and the owner manage every takeaway, including authorless ones", ...);
it("keeps members out of takeaway writes", ...);                                      // FORBIDDEN
it("marks canManage per viewer and never sends authorId", ...);                        // getManageable
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run --project server src/server/api/routers/takeaway.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** the procedure, router checks, manager and page guards as listed under Interfaces.

- [ ] **Step 4: Run tests**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server src/components/admin/content src/app/admin/takeaways
git commit -m "feat(takeaways): writers manage only their own takeaways"
```

---

### Task 4: Role-aware admin shell, navigation and Drive link

**Files:**
- Modify: `src/components/admin/admin-navigation.ts` (+ `admin-navigation.test.ts`), `src/components/admin/admin-shell.tsx`, `src/components/app-sidebar.tsx`, every `src/app/admin/**/page.tsx` (pass `viewerRole` and `driveUrl`), `src/app/admin/page.tsx` (forward writers to `/admin/takeaways`), `src/env.mjs`, `.env.example`

**Interfaces:**
- Consumes: `Role`, `isStaffRole` (Task 1); `requireAdmin`/`requireTakeawayAccess` return `{ role }` (Task 1).
- Produces:
  - `export function navigationFor(role: Role)`: the subset of `adminNavigation` a role sees (staff: all; writer: only `Takeaways`).
  - `AdminShell` props gain `viewerRole: Role` and `driveUrl: string | null`.
  - `export const adminShellProps = (role: Role) => ({ driveUrl: isStaffRole(role) ? (env.DRIVE_FOLDER_URL ?? null) : null, viewerRole: role })` in `src/server/authz.ts`, used by every admin page.
  - Sidebar "Google Drive" item (Lucide `FolderOpen`, opens in a new tab), placed after "Discord server". Staff: a link to `driveUrl`, hidden if null. Writer: a disabled item with shadcn Tooltip "Only mita can open the Google Drive." The perki.bot status is shown only to staff.

- [ ] **Step 1: Write the failing test** (`admin-navigation.test.ts`)

```ts
it("shows writers only the takeaways page", () => {
  expect(navigationFor("writer").map((item) => item.url)).toEqual(["/admin/takeaways"]);
  expect(navigationFor("mita")).toEqual(adminNavigation);
  expect(navigationFor("owner")).toEqual(adminNavigation);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run src/components/admin/admin-navigation.test.ts`
Expected: FAIL (`navigationFor` not exported).

- [ ] **Step 3: Implement** `navigationFor`, the shell and sidebar props, the page wiring and `DRIVE_FOLDER_URL` (server schema + `runtimeEnv`; `.env.example` line with a comment).

- [ ] **Step 4: Run tests**

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components src/app/admin src/env.mjs .env.example src/server/authz.ts
git commit -m "feat(admin): role-aware navigation and Google Drive quick link"
```

---

### Task 5: Roles in the member directory

**Files:**
- Modify: `src/components/admin/members/member-model.ts` (+ test), `member-columns.tsx` (+ test), `member-directory.tsx`, `member-details.tsx` (+ test)
- Create: `src/components/admin/members/member-role.tsx` (role control and history inside the details sheet)

**Interfaces:**
- Consumes: `roles.setRole`, `roles.getHistory`, `roles.myRole`, `getUserProfiles` `user.role` (Task 2); `roleLabels`, `canChangeRole`, `ASSIGNABLE_ROLES` (Task 1).
- Produces:
  - URL param `role` (comma-separated, values from `ROLES`, invalid dropped), with `MemberFilters.roles: string[]`. Facet filter "Role" next to Birthday. Visible "Role" column showing `roleLabels[role]`, sortable owner → mita → writer → member.
  - `member-role.tsx`: shown in the details sheet. For a staff viewer and a non-owner target, an `AdminSelect` "Role" with `ASSIGNABLE_ROLES`. Changing it calls `setRole`, toasts "<Name> is now a <Role>.", and invalidates `profiles` and `roles`. For an owner target: read-only "Owner", with the caption "The owner's role can't be changed." Below: "Role history" with up to 5 rows, "Mita · changed by Mia · 2 days ago" (`timeAgo`).

- [ ] **Step 1: Write the failing tests**

- `member-model.test.ts`: `readMemberFilters(new URLSearchParams("role=mita,writer,bogus")).roles` → `["mita","writer"]`; `memberFilterParams({ roles: [] }).role` → `""`.
- `member-columns.test.tsx`: role filter `["writer"]` keeps only writers; role sort ascending orders owner, mita, writer, member.
- `member-details.test.tsx`: an owner target renders "The owner's role can't be changed." and no Role select; a member target with a staff viewer renders a "Role" select.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run src/components/admin/members`
Expected: FAIL.

- [ ] **Step 3: Implement** the model, column, facet, URL state and `member-role.tsx` per Interfaces.

- [ ] **Step 4: Run tests**

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/members CLAUDE.md
git commit -m "feat(members): role column, role filter and role control"
```

(Update the `/admin/members` URL-parameter line in `CLAUDE.md` with `role`.)

---

### Task 6: Initial grants and duplicate-account cleanup scripts

**Files:**
- Create: `scripts/roles.ts` (CLI), `src/lib/role-grants.ts` (pure planning), `src/lib/role-grants.test.ts`
- Modify: `package.json` (`"roles": "tsx scripts/roles.ts"`), `CLAUDE.md` (how to run)

**Interfaces:**
- Produces:
  - `planGrants(accounts: AccountSummary[], request: { owner?: string; mita?: string[]; writer?: string[] }): { changes: { userId: string; label: string; from: Role; to: Role }[]; problems: string[] }`. Each requested identifier matches an account by exact email (case-insensitive), or else by exact full name. No match or more than one match goes into `problems`. An owner request fails if a different owner exists.
  - `planCleanup(accounts: AccountSummary[], emails: string[]): { deletable: AccountSummary[]; kept: { account: AccountSummary; reason: string }[] }`. An account is deletable only if it has no profile, prayers, takeaways, prayer acknowledgements or role history.
  - `AccountSummary = { id; name; email; role: Role; hasProfile; prayerCount; takeawayCount; acknowledgementCount }`.
  - CLI: `pnpm roles grant --owner <email> --mita "<name or email>" ...` and `pnpm roles cleanup --email <email> ...`. It is a dry run by default and prints the target database host plus every planned change, with emails masked as in `je…@g….com`. `--apply` performs the changes in one transaction and writes `role_changes` rows with `changedById = null`. It exits non-zero if `problems` is non-empty, without applying anything. It reads `DATABASE_URL` and refuses to `--apply` against a non-local host unless `--confirm-host <host>` matches.

- [ ] **Step 1: Write the failing tests** (`role-grants.test.ts`)

```ts
it("matches by email first, then by exact name, and reports ambiguity", ...);
// two accounts with the same name → problem "2 accounts match "<name>""
it("refuses a second owner", ...);
it("only deletes accounts nothing refers to", ...);   // profile or prayers → kept with reason
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run src/lib/role-grants.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** `role-grants.ts` and `scripts/roles.ts`.

- [ ] **Step 4: Run tests and a local dry run**

Run: `pnpm check && pnpm roles grant --owner <owner email>`
Expected: tests PASS; the dry run prints host `127.0.0.1:54320` and one planned change for the owner, and applies nothing.

- [ ] **Step 5: Commit**

```bash
git add scripts src/lib/role-grants.ts src/lib/role-grants.test.ts package.json CLAUDE.md
git commit -m "feat(roles): dry-run-first scripts for grants and account cleanup"
```

---

### Task 7: End-to-end coverage

**Files:**
- Modify: `e2e/fixtures.ts` (add `OWNER`, `WRITER`; `ADMIN` becomes role `mita`), `e2e/global-setup.ts` (seed roles), `e2e/helpers.ts` (`loginAs(page, account)`), `e2e/admin.spec.ts`, `e2e/takeaway.spec.ts`
- Create: `e2e/roles.spec.ts`

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Write the specs**

`roles.spec.ts`:
- `a mita makes a member a writer from the member sheet, and the history shows it`
- `the owner's role is read-only for a mita`
- `the Role filter narrows the table and lives in the URL` (`?role=mita`)
- `a writer sees only Takeaways in the sidebar, a disabled Drive link with the tooltip, and gets 404 on /admin/dashboard and /admin/members`
- `a writer edits their own takeaway, has no Edit for another writer's, and gets 404 on its edit URL` (Review Focus 3)

- [ ] **Step 2: Run**

Run: `pnpm test:e2e:db && pnpm exec playwright test --workers=4`
Expected: all PASS.

- [ ] **Step 3: Commit**

```bash
git add e2e
git commit -m "test(roles): owner, mita and writer journeys end to end"
```

---

### Task 8: Rollout (no code)

- [ ] **Step 1:** Run the grant script against the **local dev database** with `--apply`. Grant the owner and the eight mita the owner confirmed (identifiers come from the conversation, never from the repo), and clean up the two confirmed duplicate accounts by email. Confirm with a dry run that shows no further changes.
- [ ] **Step 2:** Give the owner the exact production commands, without running them: the same `pnpm roles` invocations with `--confirm-host <supabase host>`, to run after the PR merges and `deploy:migrate` has applied `0010`. Ask them to set `DRIVE_FOLDER_URL` in Vercel.
- [x] **Step 3:** Follow-up issues created on 2026-10-20: #29 (invitations / access requests), #30 (Google Drive integration, including the per-person check for the quick link) and #31 (account page with member profile, role and activity history). Reference them in the PR description, but this PR doesn't close them.
- [ ] **Step 4:** Open the PR into `main` (or into #26's branch if it isn't merged yet), with `Closes` lines for the new issues if they're resolved, and link it to the thread.
