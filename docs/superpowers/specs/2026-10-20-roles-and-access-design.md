# Roles and access: owner, mita, writers

Date: 2026-10-20 · Status: draft for review

## Why

PERKI Aachen's servants ("mita", Mitarbeiter) run the fellowship: they plan
schedules about six months ahead, lead the big and small Bible study groups,
and do everything else. Today:

- The website has two roles (`member`, `admin`, from #27/#28), and only SQL in
  Supabase can change them, so every access change goes through the owner.
- Access to the church's Drive folder is managed by hand, outside the
  website, and not per person.
- Sermon summaries are written by members who are often not mita, and the
  website has no way to give them access to the takeaway pages.

New mita are agreed on by the mita together, so everyone already knows who
is joining. **Any mita should be able to give access, so it doesn't all go
through the owner.**

## Goals

1. **Four roles in the app:**
   - **Owner:** exactly one person (the project owner). Can do everything.
   - **Mita:** the whole admin workspace. Can give and remove the mita and
     writer roles, but can never change or remove the owner.
   - **Writer:** sermon summary writers, often not mita. A standing role
     (the owner's call on 2026-10-20: "that hurts nobody"), kept until a
     mita removes it.
   - **Member:** the default. Public pages, the prayer wall, own prayers.
2. **What a writer can do:** open the admin workspace, which shows them
   only **Takeaways**. They can create a takeaway for any service, and edit
   or delete **only takeaways they wrote themselves** (owner's words). So
   takeaways get an author, like prayers did in #28. Mita and the owner can
   still edit any takeaway. Takeaways written before this change have no
   author, so only mita and the owner can manage them. Every other admin
   page stays 404 for writers.
3. **Members table shows roles:** a Role column and a Role filter (owner,
   mita, writer, member), in the style of the existing Location and Birthday
   filters. Role is part of the URL state like the other filters.
4. **Role management in the admin workspace:** owner and mita change a
   person's role without SQL.
5. **Accountability:** every role change is recorded with who made it,
   whom it affected, old role, new role and when. Mita and the owner can see
   that history.
6. **Initial mita** (identities confirmed by the owner on 2026-10-20 against
   a copy of production data):
   Eight people. The owner matched each name to an account on 2026-10-20,
   against a copy of production data. The list stays out of this repo
   because it is public; the owner holds it. The owner role goes to the
   project owner's own account.

7. **Google Drive quick link** in the admin sidebar, next to "Discord
   server" and "Visit website". Mita and the owner see a working link.
   Anyone else who reaches the admin workspace (writers) sees it
   disabled, with a tooltip saying only mita can open the Drive. Until the
   Drive integration exists, "is mita" stands in for "has Drive access".
   The folder URL comes from an environment variable, not the code: the
   repo is public and the folder holds private notes. The link is hidden if
   the variable isn't set.

## Non-goals (follow-up issues #29, #30 and #31, not this project)

- **Google Drive integration:** granting or revoking mita access also shares
  or unshares the Drive folder with the person's own Google account, so
  access follows the role automatically. Needs the Drive API acting for the folder's owner
  account; a separate design. It would also let the Drive quick link check each
  person's real access and offer "Request access" instead of a fixed
  tooltip.
- **Invitations / access requests:** invite someone who has no account yet,
  or let a person request mita access. Today an account must exist before it
  can be given a role.
- **The takeaway workflow itself.** Summaries currently also flow through
  Google Drive. This project only gives writers access to their takeaway in
  the app; how summaries get from Drive to the site is still to be
  discussed.
- Linking a schedule's "Note writer" to an account (e.g. "your next service
  to write up"). The schedule form keeps its plain name list. A possible
  later convenience, no longer needed for access.
- More roles (e.g. worship team). Not requested.

## Anti-goals (would make this a failure even if it "works")

- Anyone other than the owner can remove, demote or replace the owner, or
  become owner. This includes a mita demoting themselves into a state where
  no owner exists.
- Access decided on the client. Every rule is enforced on the server, read
  from the database on each request (as #28's `isAdmin` already does).
- A writer can change a takeaway someone else wrote.
- Role changes nobody can trace.

## Constraints

- **Migrations run in CI after merge while Vercel deploys in parallel**
  (`CLAUDE.md`): every schema change must keep the *previous* release
  working. Today's code checks `role === "admin"`. Replacing `admin` with
  new values in one step would lock admins out during the deploy window, so
  add first and remove later (expand/contract, possibly across two PRs).
- Postgres enum `user_role` (`member`, `admin`) exists in production from
  #27. Adding enum values is safe; removing one needs a later migration.
- The repo is public: nothing security-sensitive in issues, PRs or commits.
- Existing pages and patterns: admin pages call `requireAdmin()`, tRPC uses
  `adminProcedure` (`src/server/authz.ts`, `src/server/api/trpc.ts`); the
  members directory and its filters live in
  `src/components/admin/members/`.

## Decided

- Owner is a role, held by exactly one account. This is enforced in the
  database, not only in code.
- Mita = today's `admin` capabilities, plus role management (except the
  owner).
- Writers get access through a standing **writer** role, not through the
  schedule's note-writer assignment (owner's change on 2026-10-20).
- Two duplicate accounts found while matching names get cleaned up: one
  with no member profile, and one legacy account with no email or login
  method. The owner confirmed which accounts these are.
- Drive integration and invitations become GitHub issues (non-goals above).

## Builder's calls (Claude's calls; owner may override)

- **Roles stay a column on `user`** (each person has exactly one role)
  rather than a separate roles table. A separate table pays off only if one
  person can hold several roles or roles need attributes; neither is true
  now. The audit history is a new table.
- **Where role changes happen:** in the existing member details sheet (a role
  control visible to owner and mita), not a separate page. The Role column
  and filter make the people to act on easy to find.
- **Ownership is fixed:** there is no transfer flow in the app. The database
  allows at most one owner (unique partial index), and the server refuses
  every change to or from the owner role through the app. Changing the
  owner, if ever needed, is a deliberate SQL step by the owner.
- **Who can be given a role in the app:** people in the member directory
  (accounts with a member profile). Mita are expected to have a profile. An
  account without one (today: one of the eight) gets its initial role via the
  one-off script below, and the person is asked to fill in their profile.
- **Initial grants and cleanup never put personal data in the repo** (it is
  public). The builder ships a script that takes names or emails as input at
  run time and prints what it would change before changing it. The owner
  runs it against production; the builder runs it against the local dev
  database. The e2e database is rebuilt every run, so it seeds its own
  test accounts with roles in `e2e/global-setup.ts`.
- **Cleanup** of duplicate accounts deletes an account only if it has no
  profile, prayers, takeaways or prayer acknowledgements. Otherwise it reports the account for the owner to decide;
  there is no automatic merge.
- Exact UI copy, the name of the history view, and test structure are left
  to the builder, following the existing admin design system.
