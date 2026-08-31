# Navigation & route structure

Expo Router is the navigation backbone and the **only** navigation API: `@react-navigation/*` imports are banned (lint-enforced). Import `DefaultTheme` / `DarkTheme` / `ThemeProvider` etc. from `expo-router`, which re-exports them.

The two route-structure rules below are recorded as prose because their load-bearing half can't be encoded as a lint rule (R-1).

## Route screens that need a test are thin entrypoints over a feature `ui/` module (or a shared `@/components` module for shell screens)

Expo Router's `require.context` bundles **every** `*.tsx` under `src/app/` as a route — a colocated `*.test.tsx` drags `@testing-library/react-native` (Node-only `console`/`picocolors`) into the Metro bundle and breaks it. The `routes-not-importable` lint then forbids importing the route from a test elsewhere.

So the screen lives outside `src/app/` (tested there), and `src/app/<name>.tsx` is a one-line re-export. A feature screen lives in its feature's `ui/` sublayer — `src/features/<feature>/ui/<name>-screen.tsx` — and the route is `export { <Name>Screen as default } from "@/features/<feature>/ui"` (through the `ui/` sub-barrel); a shared shell screen (the tab bar) stays in `src/components/`. `ui/` is under `src/features/`, not `src/app/`, so it's a valid home for the colocated test, same as `src/components/`. Enforced indirectly by the lint boundary; the Metro-bundling half can't be a lint rule, hence this prose.

## Non-tab routes require a root `Stack` with the tabs in a `(tabs)` group

Under a root `NativeTabs` layout, only declared `NativeTabs.Trigger` routes are reachable — a bare sibling route is registered but **cannot** be navigated to (`hidden` triggers are unreachable too).

The layout is therefore:

- `src/app/_layout.tsx` = root `Stack` (+ the QueryClient/Theme providers).
- `src/app/(tabs)/_layout.tsx` = the native tabs; tab screens under `(tabs)/`.
- Non-tab routes (deep-link / modal / onboarding targets) as `Stack` siblings of `(tabs)`.

The stable tab hierarchy is Home · Calendar · Settings (ADR
[034](./decisions/034-settings-third-tab-identity.md)). Calendar and Settings each own a
nested native Stack while retaining `/calendar` and `/settings` as their canonical
tab routes. `src/app/(tabs)/settings/index.tsx` is a thin export from
`@/features/settings/ui`; derivation and tested presentation stay in the feature.
The root `/profile` route is a compatibility redirect to `/settings` for one released
React Native version, and is not an internal navigation target.

`/about` is a root Stack sibling with a visible localized header and a one-line route export
from `@/features/about/ui`. The Settings hub's explicit App section owns the `/about` entry;
the feature owns the content and consumes Settings' exported grouped-list primitives.

Root `/feedback` is a header-capable Stack sibling reached from Settings or a recorded
iCal import failure. Its optional route parameters are limited to `calendarUrl`,
`schoolId`, `schoolName`, and `calendarName` (the normalized programme name from the
import draft, omitted when empty); the route is a thin re-export from the feedback feature.

`/activity` is a visible-header root Stack sibling reached from the Settings Events section and
deep-linkable as `timecalendar-dev://activity`. `src/app/activity.tsx` is a one-line re-export
from `@/features/activity/ui`; grouping, pagination, errors, and accessibility remain feature-owned.

`/changelog` is a visible-header regular root Stack destination reached from About and
renders every bundled release. `/changelog-sheet` is a visible-header root modal: an iOS
form sheet with a large detent/grabber and an Android full-screen modal. Both are thin route
exports over `features/changelog/ui`. The automatic `ChangelogGate` mounts only inside the
`(tabs)` layout, never the root or onboarding Stack, so tabs arrival is the first eligible
presentation point and cold onboarding cannot be covered.

The nested `onboarding` group is **welcome-first** (ADR [015](./decisions/015-onboarding-flow-shape.md)): `onboarding/index` = the welcome surface (`timecalendar-dev://onboarding`), `onboarding/school` = the school picker (`…/onboarding/school`). Its index is the first-run deep-link surface, not the bare list; adding calendars from Settings continues through calendar management's native header action.

First launch is protected by ADR [054](./decisions/054-ordered-startup-and-first-launch-protected-routes.md).
After ordered startup prerequisites, one atomic `{ calendars, loaded }` calendar-sources snapshot
keeps the splash mounted until eligibility is known. Zero calendars with no durable resolution leave
onboarding as the first available route; `(tabs)` and every post-onboarding root sibling live inside
one `Stack.Protected` guard and therefore cannot mount or paint underneath a redirect. Onboarding
remains reachable after resolution. The development-only token-import route is the sole direct
exception and retains its runtime app-variant action gate.

From the school step the group carries the **import journey** (ADR [047](./decisions/047-ephemeral-calendar-import-draft.md)): a school row opens `onboarding/programme`, "I can't find my school" opens `onboarding/institution-name` → `onboarding/programme`, then `onboarding/connect` → `onboarding/import`, which offers the existing `onboarding/qr-scan` and `onboarding/ical-url` Stack siblings. The Connect → import edge is the explicit insertion point for a future assistant step. Every new route is a one-line re-export from `@/features/onboarding/ui`.

`onboarding/groups` (`…/onboarding/groups?schoolId=<id>`) is **off the normal path** — it persists a selection and dismisses without creating a calendar. It keeps its route and stays deep-linkable; deleting it is a separate cleanup.

`src/app/onboarding/_layout.tsx` mounts `ImportDraftProvider` around the nested `Stack`, so the draft wraps every route in the group — including the QR and iCal-URL siblings, which is what lets a failed import switch between them. Those two routes stay usable with **no** draft (dev links, external links, restored navigation): they create with `name: ""` and `schoolName: ""` rather than redirecting.
