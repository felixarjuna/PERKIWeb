---
name: ship-it
description: Use when a change in PERKIWeb is finished, and when the owner says "merge". Checks it, screenshots the changed pages on phone and desktop, commits, and opens a PR the owner can review from the PR page alone. Run it without asking first.
---

# Ship it

The owner reviews on the PR page, not in chat. A PR they can judge in a minute is the goal: what changed and why, proof that it works, and screenshots. Open it without asking. Never merge until they say "merge".

## 1. Check

Run `pnpm check`. Fix anything red, including failures you didn't cause, before going on. Never open a PR on a red check.

## 2. Screenshot what a user would see

Skip this step when nothing visible changed (scripts, CI, server-only fixes with no UI effect), and say so under Verification instead.

1. Write `e2e/screenshots/current.shots.ts` (gitignored, one per change). Seed the data the page needs, sign in as whoever uses the page, go there, and call `shoot()`. Show the state the change is about: the fixed section, the new dialog open, the error message showing.

   ```ts
   import { test } from "@playwright/test";
   import { setTestSession } from "../auth-fixtures";
   import { insertSchedule } from "../db";
   import { MEMBER } from "../fixtures";
   import { shoot } from "./shoot";

   // Runs once, before both screen sizes.
   test("seed @seed", async () => {
     await insertSchedule("Bible study", new Date(/* this Saturday 15:30 */));
   });

   test("schedule, this week", async ({ page }) => {
     await setTestSession(page, MEMBER);
     await page.goto("/schedule");
     await shoot(page, "schedule");
   });
   ```

   Seeded accounts and helpers: `e2e/fixtures.ts` (`MEMBER`, `ADMIN` for staff pages, `WRITER`), `e2e/db.ts`, `e2e/helpers.ts`. Insert any other rows with drizzle the way `e2e/db.ts` does. Create data only in the `@seed` test: every other test runs once per screen size against the same database. `MEMBER` has no profile, so app pages show the profile reminder; that's real, leave it unless it hides what the PR is about.
2. `pnpm test:e2e:db`, then `pnpm screenshots` (builds the app; add `E2E_SKIP_BUILD=1` when `.next` is already a build of this code).
3. Open every PNG in `screenshots/` with Read and look at it. A blank page, a sign-in redirect, a loading spinner or an empty list where data should be means the shot is wrong: fix the shots file and run again. If a screenshot shows a bug, fix the bug.

Screenshots only ever show e2e seed data. The repo is public, so never point this at the dev or production database.

## 3. Commit and push

- Branch from `main` if still on it (`fix/…`, `feat/…`, `chore/…`).
- Small ordered commits, Conventional Commits: `type(scope): subject`, imperative, no trailing period. The body says why, not what the diff already shows. End with the attribution trailer from the system reminder.
- Push with `-u origin <branch>`.

## 4. Publish the screenshots

`pnpm screenshots:publish` (on the PR's branch, after pushing) copies `screenshots/` to the `pr-screenshots` branch and prints a `## Screenshots` markdown table. Paste it at the end of the PR body.

## 5. Open the PR

`gh pr create --base main` with the title in commit style and this body. It's a one-minute briefing for someone who will glance at the diff: short sentences, few identifiers, under about 40 lines. Leave out any section with nothing to say except Scope and Verification.

```markdown
## Why
The problem in the owner's words (what a member saw), and the fix in a sentence.

## What changed
- 1–3 bullets. Name a file or symbol only when it carries the change.

## Scope
- What this covers and what it leaves out (follow-ups, known gaps).
- A migration: say so and name the deploy window (CI applies it after merge; until then the new release can fail on the missing column).

## Verification
- `pnpm check` passed (N tests).
- What you opened in the real app, as whom, and what you saw.

Closes #n

## Screenshots
(output of pnpm screenshots:publish)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Then link it to the thread with `link_pull_request` and reply with one line: what the PR does, and its URL. Nothing else needs saying in chat; the PR carries it.

## 6. When the owner says "merge"

1. `gh pr checks <n>`. If anything failed, say what and fix it instead of merging.
2. `gh pr merge <n> --merge --delete-branch`, then `git switch main && git pull`.
3. If the PR had a migration, say that `deploy:migrate` applies it on `main` and the deploy window is open until it finishes.
