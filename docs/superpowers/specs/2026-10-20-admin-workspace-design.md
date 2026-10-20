# PERKI central admin workspace

Status: approved for implementation. Schedule/takeaway route relocation landed separately in PR #22 before this branch; this implementation builds on that merged baseline. The implementation plan records the remaining redesign and publication work.

## Purpose

Give PERKI administrators one coherent workspace for community records and content management. Public visitors should be able to read schedules, takeaways, and published prayers without encountering administrative controls or needing an account. Most people use phones, so every management workflow must work at narrow widths.

This session covers the existing admin dashboard and the management flows that already exist elsewhere. Role-based access control and member journeys/testimonies are separate implementation projects.

## Design decisions

- Reuse the agreed site identity: green semantic surfaces, cream actions, Reimbrandt headings, and Satoshi body text. Follow the documented type and control roles in `src/styles/globals.css`; do not introduce a second theme or synthesized font weights.
- Use a shared admin shell with distinct Overview, Members, Schedules, Takeaways, and Prayers destinations. Overview is the dashboard; the directory has its own page.
- Keep administrative forms, lists, and navigation inside that shell. Public reading pages keep the public page shell.
- On desktop, use a persistent sidebar with labelled destinations, an active state, an account menu, and a link back to the website. Content must never sit underneath the sidebar.
- On phones, use a compact header and an accessible navigation sheet. Show the current page title, retain visible navigation labels in the sheet, and return focus to the trigger on close.
- Do not add nonfunctional navigation entries for future roles or testimonies.

The alternative of one long dashboard makes directory work and content editing compete for space. A broad CRM built from scratch would also pull the separate permissions and testimony projects into this session. The shared shell around the existing domains is the selected approach.

## Routes and responsibilities

| Destination | Route | Responsibility |
| --- | --- | --- |
| Overview | `/admin/dashboard` | Community registration metrics, birthdays, and links into management |
| Members | `/admin/members` | Member search, filtering, sorting, and read-only profile details |
| Schedules | `/admin/schedules` | Search and manage existing schedules |
| New schedule | `/admin/schedules/new` | Existing schedule creation and batch capabilities |
| Edit schedule | `/admin/schedules/[id]/edit` | Existing schedule editing |
| Takeaways | `/admin/takeaways` | Search and manage notes linked to schedules |
| New takeaway | `/admin/takeaways/new` | Existing takeaway creation |
| Edit takeaway | `/admin/takeaways/[id]/edit` | Existing takeaway editing |
| Prayers | `/admin/prayers` | Existing prayer management plus explicit public visibility |
| Admin entry | `/admin` | Retain the existing entry flow pending RBAC integration |

Move legacy create/edit routes to redirects to the corresponding admin route, preserving record IDs. Perform authentication before loading editing data. Return to the relevant admin list after saving or cancelling. Public navigation must not link directly to legacy management routes.

## Overview

Use real profile data for registered member totals, new registrations in the selected month, previous-month comparison, and a monthly registration chart. Default to the current month and a six-month chart range; offer a twelve-month range. Define months in `Europe/Berlin` and use half-open date intervals to avoid month-boundary double counts.

Registration means profile creation, not account creation. Label charts as member registrations. Cumulative values represent currently retained profiles created up to each month; they do not reconstruct deleted profiles or measure net membership change. Exclude null creation dates from time series and explain any difference from the total. Show absolute month comparison when the previous count is zero rather than an invalid percentage.

Provide an all-locations default and a location filter shared by overview metrics and birthdays. Offer a month selector for birthdays; list every matching member by calendar day, including birthdays earlier in the month. Display name, location, and day/month, with a link to member details. Do not show birth years or age in the overview. Handle missing and invalid dates without breaking the list. Remove animated status dots and the unsupported operational claim about the bot.

## Members

Search case-insensitively across name, email, and phone; trim search input. Filter by location, including a named missing-location option. Trim and group equivalent location spellings that differ only in case; do not silently merge different cities.

Offer name ascending/descending, newest/oldest registration, location ascending, and birthday calendar order. Missing dates sort last in either direction; equal values have a stable ID tie-breaker. Default to name ascending. Search, filters, sort, page, and page size belong in URL query parameters so reload and browser navigation preserve the view. Changing a filter, sort, or page size resets pagination; clamp invalid pages after data changes. Offer 10, 25, and 50 rows per page, defaulting to 10.

The desktop table prioritizes name/email, location, birthday, registration date, and a labelled View details action. Phone, major, address, and bio belong in the details view rather than forcing a very wide table. Allow long values to wrap in details. Mobile uses a card list with the same filtering, sorting, pagination, and detail actions. Use one active presentation at each breakpoint so keyboard and assistive-technology users do not encounter duplicate records.

Details open in an accessible side sheet on desktop and a full-width sheet on phones, with a stable member ID represented in the URL. Invalid or missing IDs show a recoverable not-found state. Restore focus on close. This phase does not add profile editing on another person's behalf, exports, member deletion, or bulk actions.

## Schedules

Move create, batch-create, edit, and delete entry points into the admin schedule section. Keep existing fields and validation. Provide title/speaker search, event-type filtering, upcoming/past/all filtering, and date sorting. Default to upcoming schedules ordered earliest first. Keep all filters available in empty-result states, with a clear reset action.

Use a compact desktop list/table and mobile cards. Confirm deletion with the schedule title and explain any linked takeaway consequences. Do not introduce cascade deletion implicitly: if linked takeaways exist, block deletion and direct the administrator to manage those first. This dependency check belongs on the server as well as in the UI.

The public schedule page remains readable without a session. Remove create/edit/delete controls and their mutation hooks from its rendering path. Preserve public event descriptions and servant information already displayed there.

## Takeaways

Move create, edit, and delete into the admin takeaway section. Preserve schedule association, contributors, and keypoints. Provide title/content search, event-type filtering, and event-date sorting, newest first by default. Keep filters rendered when the result is empty.

The public takeaway page remains a read-only, anonymous-access view with its event filter. Saving in admin immediately updates the public content, matching the current data model. Do not invent draft or publishing states for schedules and takeaways in this phase.

## Prayers and public visibility

Make `/prayers` a public reading route for explicitly published requests. Existing records have only been exposed behind sign-in; do not automatically publish them as a consequence of moving the UI.

Add an explicit private/published visibility field with a private default for both existing and newly submitted prayers. Admin can review the text and displayed author, publish, return to private, edit, and delete through the admin prayer section. Provide content search, visibility filtering, and newest/oldest sorting. Anonymous author presentation must remain anonymous in the public response.

Use a dedicated public query selecting only published prayer IDs, content, safe display author, creation date, and aggregate prayer count. It must omit `prayerNames` and other private participant data. Keep the administrative query authenticated. A visibility update and its public effect must be backed by a real mutation, pending feedback, and query invalidation.

Retain public participation through a signed-in submission form and signed-in prayer acknowledgement. Anonymous visitors can read, with a sign-in action to participate that preserves the return destination. Public pages have no edit/delete or publication controls, including for signed-in visitors. Do not weaken mutation authentication or expose the full administrative response to support anonymous reading. Broader acknowledgement identity/model changes belong outside this redesign unless required to preserve the existing flow.

## Components and data flow

Create a shared admin layout and navigation configuration. Keep route-specific data and interactions in focused overview, member, schedule, takeaway, and prayer components. Reuse existing shadcn primitives and extract form content from page shells so it can live inside admin without nesting public templates.

Retain TanStack Table where it serves the member directory and reuse shared filter/pagination controls where semantics match. Share the member filtering and sorting transformation across desktop and mobile presentations. Derive aggregate metrics from the complete authorized dataset, never the current page. Keep calculation and date helpers pure and testable.

Use existing tRPC routers, typed outputs, and React Query invalidation. Select only required user fields; never send password hashes. The prayer visibility migration and safe public query are the only planned new persistence in this phase. Member journey records, document storage, and role assignments are deferred.

Before writing implementation code, read the relevant installed Next.js guides under `node_modules/next/dist/docs/`, as required by AGENTS.md. Use the installed library APIs rather than assuming older Next.js or TanStack conventions.

## Authentication boundary and follow-up work

Retain the current server session requirement and client admin gate while relocating flows; reuse one gate across admin navigation. This gate is a transitional UX mechanism, not role enforcement. Keep authenticated procedures authenticated. Moving buttons does not establish server-enforced administrative permissions.

Coordinate with the active login/registration work before changing authentication-related files. RBAC will separately introduce server-enforced permissions for routes, queries, and mutations plus an integrated role-assignment UI. Do not add placeholder permission checks that always allow access or present the redesign as completion of RBAC.

Member membership dates, Bible study enrollment/completion, service history, and authored public testimonies are a separate project. The future servant-eligibility rule depends on an agreed testimony review/publication state; this session does not invent that state or connect Google Drive records.

## Interaction and accessibility

Every page has a meaningful heading, visible labels, keyboard-operable controls, focus indicators, and descriptive button names. Use semantic links for navigation and buttons for actions. Decorative icons must not carry inaccessible interactive behavior; give standalone SVGs appropriate titles. Respect repository accessibility rules.

Design for 320px and 390px phone widths, tablet, and 1440px desktop. No horizontal document overflow or sidebar obstruction. Confine necessary table scrolling to its own region. Use touch-friendly targets, phone-sized form text, and wrapping toolbars. Prefer short state transitions over ambient movement and respect reduced motion.

Distinguish initial loading, background refresh, server error, no records, and no filter matches. Errors have retry actions. Failed mutations preserve entered data; disable duplicate submission, show pending state, and report success only after completion. Destructive actions require a concrete confirmation naming the record. Dialogs and sheets remain scrollable and keep their close/submit controls reachable on phones.

## Acceptance and validation

1. All five admin destinations use one shell and work through desktop and mobile navigation. Browser refresh and back/forward preserve directory state.
2. Search, combined filters, sort direction, missing values, pagination reset, and detail navigation produce consistent desktop/mobile results.
3. Birthdays list the entire selected month in calendar order, respect location, and handle year and timezone boundaries. Growth metrics follow the definitions above.
4. Schedule and takeaway create/edit/delete flows remain functional inside admin, preserve relationships, and invalidate the appropriate reading queries. Legacy editing URLs redirect correctly.
5. Anonymous visitors can read schedules, takeaways, and published prayers. Public pages have no management controls. Existing private prayers and participant names are absent from anonymous responses.
6. Prayer publication, unpublication, editing, deletion, signed-in submission, and acknowledgement work without changing private/public boundaries accidentally.
7. Add meaningful helper/component tests for directory behavior and metrics; integration tests for prayer visibility and schedule dependency checks; browser coverage for public reading, relocated CRUD, and narrow-screen navigation. Update existing tests whose selectors or URLs intentionally change.
8. Run lint, typecheck, relevant unit/integration tests, production build, and affected end-to-end flows against the repository's isolated test database. Inspect desktop and mobile screenshots, keyboard focus, overflow, and form/sheet scrolling. Do not use the production database for verification.

## Delivery boundaries

Implementation follows review of this specification and its implementation plan. Deliver the admin/public separation as a coherent change with verification evidence. Do not launch separate RBAC or testimony sessions, publish private documents, push changes, or deploy based solely on this specification's existence.
