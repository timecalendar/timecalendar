# User calendars ("Mes calendriers"): the management screen over the durable token store, with per-calendar visibility filtered at the events-source seam

## Why

Phase 03 shipped the durable `user_calendars` token store (ADR 018) and its reactive
read (`useUserCalendars()`) but **deliberately shipped no list UI** ("no list UI ships
this phase" — Phase 03 exit criteria). The Flutter `user_calendars_screen` ("Mes
calendriers") is therefore a **parity gap**: the user has no way to see the calendars
they hold, toggle a calendar's visibility, delete one, or add another. This change ships
that missing management surface — the auxiliary-features (Phase 07) home for the step.

Unlike the Phase-05 ships this writes **NO new irreplaceable data and adds NO schema**:
the whole data layer already exists and is tested
(`mobile/src/features/calendar-sources/data/user-calendars/` —
`repository.remove(id)` / `repository.setVisible(id, visible)` / the reactive
`useUserCalendars()`). The one real *behavioral* change is that the visibility checkbox
must **filter a calendar's events out of the Home + Calendar timeline**. Everything else
is a presentational screen over an existing seam, mirroring the `hidden-events` sibling.

## What Changes

- **A new `ui/` sublayer + an observability-wrapped actions hook** in the existing
  `src/features/calendar-sources/` feature — the home of the "your calendars" concern the
  Phase-03 data layer already anticipated. No new feature folder.
- **The events-source seam absorbs a visibility filter** — `useCalendarEvents(range)`
  (`calendar/data/events.ts`) reads `useUserCalendars()`, builds the set of currently
  **visible** calendar ids, and keeps an event iff it is personal
  (`userCalendarId === undefined`, always shown) OR its `userCalendarId` is in the visible
  set. One more filter of the identical shape as the hidden-events filter, in the same
  `useMemo` — covering day/week/agenda AND home with **no consumer change**. A deleted
  calendar drops out of `useUserCalendars()` so its events vanish immediately: correctness
  holds with **no `calendar_events` purge**.
- **A per-row visibility checkbox, delete, and an add affordance** on a new
  `ui/user-calendars-screen.tsx`, plus an empty state — mirroring the `hidden-events` row
  grammar and the panel-decided delete pattern (a visible trailing delete button on both
  platforms + a native `Alert` confirm + a post-delete `AccessibilityInfo.announceForAccessibility`
  + a `WriteErrorNotice` failure surface; iOS adds swipe-to-delete on top, gated by the same
  `Alert` and reachable non-visually via `accessibilityActions`). **No undo** (`remove()` is
  irreversible; a snackbar would lie).
- **A small observability-wrapped actions hook** (`useUserCalendarActions`) alongside the
  data layer (mirroring `useHideActions`) wrapping `setVisible` + `remove` — a failed write
  is a crash-worthy local-persistence failure → `@/firebase` `recordError` + a `failed`
  flag the screen renders via `WriteErrorNotice`. The visibility read/filter is
  total/infallible.
- **A route + a Profile entry** — a thin `src/app/user-calendars.tsx` re-export (mirroring
  `hidden-events.tsx`) registered as a `Stack` sibling of `(tabs)`, and a "Calendriers" /
  "Calendars" `Link` on the Profile tab (same accessible-link shape as the existing
  entries).
- **An "add a calendar" affordance** routing to school selection (`/onboarding/school`) —
  Flutter-FAB parity, a second in-context add path (the Profile onboarding link stays).
- **No new dependency, no new Drizzle table, no new migration, no `app.config.ts`/babel/native
  change.** `react-native-gesture-handler` (the iOS swipe) is already installed and the app
  is already wrapped in `GestureHandlerRootView`.

## Capabilities

### New Capabilities

- `mobile-user-calendars`: view every held calendar, toggle a calendar's visibility (a
  render-only flag that filters its events out of the timeline), delete a calendar
  (confirm-gated, both-platform button + iOS swipe, no undo), and add another (route to
  school selection), reached from a Profile entry — with the visibility toggle + delete
  writes wrapped in a crash-worthy-write observability posture, over the **existing** durable
  `user_calendars` data layer (no new schema/migration).

### Modified Capabilities

- `mobile-calendar-sync`: `useCalendarEvents(range)` (the single events-source seam) now
  ADDITIONALLY filters out events belonging to a calendar whose `visible` flag is false —
  built from `useUserCalendars()`, keeping personal events (no `userCalendarId`) always —
  behind the unchanged seam signature and `CalendarEvent` shape, so no calendar-view consumer
  changes.

## Impact

- New: `mobile/src/features/calendar-sources/data/user-calendars/actions.ts` (the
  observability-wrapped `useUserCalendarActions`) + its test; re-exported through the
  `data/user-calendars/` + `data/` + feature barrels.
- New: `mobile/src/features/calendar-sources/ui/user-calendars-screen.tsx` + its test;
  re-exported through `ui/index.ts` and the feature barrel.
- New route: `mobile/src/app/user-calendars.tsx`; registered in
  `mobile/src/app/_layout.tsx` (`<Stack.Screen>` sibling of `(tabs)`).
- Modified: `mobile/src/features/calendar/data/events.ts` (the visibility filter) and its
  test `events.test.ts` (the filter branch is at the 90% gate).
- Modified: `mobile/src/app/(tabs)/profile.tsx` (a "Calendriers" / "Calendars" entry link)
  and `mobile/src/i18n/locales/{en,fr}.json` (the profile link, screen title, row/delete/add
  labels, empty state, write-error message).
- New: `mobile/.maestro/user-calendars.yaml` (render + reachability of the management screen;
  the populated toggle/delete round-trip is seeded-data-limited like the other flows).
- Docs: `docs/mobile/architecture-book/{features.md,calendar.md,firebase.md,architecture-changelog.md}`
  + a new ADR (the visibility-filter-at-the-seam contract) + the ADR README index.
- **No new dependency, no `app.config.ts`/babel/native change, no Drizzle schema/migration
  change** (the data layer already exists).
