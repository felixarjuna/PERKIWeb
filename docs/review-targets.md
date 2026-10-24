# Review targets (#89)

## Approved design

Reviewers read first, then open feedback beside the document on wide screens or
in a bottom sheet on smaller screens. Notes and TL;DR each have a feedback entry
point and unresolved count. Selecting a passage supplies its target automatically.
General comments remain available without selecting text. Comments and suggested
edits retain their original target and quote when closed or when context changes.

This is a preservation change to the product workspace. Keep Next.js 16 / React
19, Tailwind 4, the existing Radix shadcn components, lucide icons, Satoshi body
and Reimbrandt headings, semantic green/cream tokens, filled inputs and existing
radius scale. DESIGN_VARIANCE 3, MOTION_INTENSITY 2, VISUAL_DENSITY 5: predictable
reading order, restrained overlay transitions and ordinary product spacing.
Design-taste's marketing compositions and imagery do not apply. No Mobbin screens
were inspected. The approved interactive comparison supplied the design direction.

## Implementation

- Add checked text targets (`notes`, `tldr`) to comments and suggestions, defaulting
  to notes. Generate the additive migration after 0024.
- Carry target through protected review APIs. Apply a replacement only to its
  target in the current working copy; preserve published text and revision rules.
- Reuse the selection reader and shared forms, Button, Badge and overlay primitives.
  Keep unsent drafts outside dismissible surfaces and separate by target/kind.
- Preserve shared-draft, submit, request-changes, editor dirty guards and permissions.
  Public responses never include review metadata.
- Provide labelled controls, keyboard selection actions, Escape and focus return,
  visible quotes, recoverable errors, loading and empty states.

## Proof

Test identical passages in notes and TL;DR, legacy defaults, invalid targets,
stale passages, permissions and published revisions. Exercise the real production
app at desktop, phone and 320px / zoom: selection, comment, suggest, accept,
close/reopen, context changes and keyboard focus. Inspect both theme class states
(the existing theme uses the same palette), publish seed-only screenshots, run
`pnpm check` and affected browser regressions, then obtain independent GPT review.

Migration `0025_review_targets` is additive and compatible with the previous
release. Vercel and the main-branch migration job run separately; the new review
queries require this migration before they can serve feedback.

Independent GPT review checked target/revision isolation, TL;DR length, pending
submissions across responsive remounts, focus restoration, retained errors and
in-flight editor changes. All findings were addressed. Local `pnpm check` passed
101 files / 706 tests. Browser proof includes real pointer selection, keyboard
opening/Escape/focus return, 320px reflow, 200% zoom, retry and draft preservation.
