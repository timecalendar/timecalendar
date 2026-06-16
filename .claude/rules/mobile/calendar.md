# Calendar

The Phase-04 calendar surface. Entries below are R-1 pointers plus the caveats
tooling can't carry; the load-bearing decisions are **ADR
[019](./decisions/019-calendar-rendering-adopt-calendar-kit.md)** (adopt
`@howljs/calendar-kit` v2 behind a seam, salvage the overlap/time-grid primitives)
and **ADR [020](./decisions/020-calendar-kit-seam.md)** (the seam form). This ship is
**day/week timeline rendering** (Phase-04 item 1, first half); the agenda/planning
list and calendar sync are scoped follow-ups that build on what lands here.

## The renderer dependency — `@howljs/calendar-kit` v2, pure-JS

- `@howljs/calendar-kit` (`~2.5.6`, `npx expo install`-pinned) is the day/week timeline
  renderer (ADR 019 — the Phase-04 spike's adopt decision). It is **pure-JS**: it
  autolinks **nothing**, adds **no `app.config.ts` plugin**, and **does not bump the EAS
  fingerprint** — it rides the OTA lane (its native footprint is inherited entirely from
  the already-present Reanimated/gesture-handler). Its `luxon` / `rrule` / `lodash.*`
  transitives enter the lockfile.
- It requires a **`GestureHandlerRootView` ancestor** (verified in the spike). Mounted as
  the **outermost** wrapper in `src/app/_layout.tsx` (`style={{ flex: 1 }}`, from
  `react-native-gesture-handler`, already a dep). This is **app infrastructure**, not a
  calendar-kit import — it is the standard RN gesture root and benefits any future gesture
  surface, so it is NOT behind the calendar seam (D5).

## The chrome-wrapper seam + lint ban — ADR 020

- `src/components/chrome/calendar-kit.tsx` is the **single import site** for
  `@howljs/calendar-kit`. Feature/screen/route code imports `@/components/chrome`, never
  the library — **lint-enforced**: `mobile/eslint.config.js` `chromeAlphaImportPatterns`
  bans `@howljs/calendar-kit` (+ subpaths) everywhere except `src/components/chrome/**`
  (re-set off for the `timecalendar/chrome-seams` block, mirroring `@expo/ui`).
- **The ban's justification is swap-reversibility, NOT alpha churn** (the load-bearing
  nuance vs. ADR 010): calendar-kit is a stable dep, but it is the #1-risk surface on a
  single maintainer, so the lint-enforced single import site is what makes "fork or swap
  to custom behind the unchanged wrapper" cheap (ADR 019's revisit anticipates exactly
  this). The constant is named `chromeAlphaImportPatterns` but the list is really "imports
  reachable only through a chrome wrapper" — its doc comment says so; a rename is ADR
  020's revisit trigger (out-of-scope line churn here).
- The wrapper stays **thin** (R-2): it re-exports `CalendarContainer` / `CalendarHeader` /
  `CalendarBody` + the `EventItem` type, and owns `buildCalendarTheme(@/theme tokens)` —
  the token → calendar-kit `theme` mapping so the grid/header/now-indicator can't drift
  from the brand palette (the now-indicator rides `primary`). No higher-level composed
  calendar from a sample of one consumer; that is earned by the agenda/home ships.

## The salvaged primitives — pure, owned, 90%-gated, the fallback insurance

Owned **regardless of the renderer** (ADR 019's salvage mandate), under
`src/features/calendar/data/`, pure (no React, no calendar-kit, no `@/db`, no `t()`):

- **`overlap-layout.ts` — `layoutOverlaps<T extends Interval>`** ports the spike-validated
  unbounded-column packing (5-way cluster → 5 even columns; A/B/C → exact thirds; freed
  columns reused; chronological stable sort; fractional `startX`/`endX`).
- **`time-grid.ts`** — the Flutter-parity grid constants as named exports
  (`GRID_START_MINUTE = 7*60`, `GRID_END_MINUTE = 21*60`, `DEFAULT_PIXELS_PER_HOUR = 60`,
  `HOURS_COLUMN_WIDTH = 50`, `MIN_TILE_WIDTH = 20`) + the pure math (`minuteToPixel`,
  `eventHeight`, `hourLabels`, `nowIndicatorPosition`).
- These are the **de-risking insurance**: the day/week screen renders through calendar-kit
  (its own internal layout), so the primitives' first **rendering** consumer is the agenda
  follow-up + the home today-grid; their first **tested** consumer is this ship's suite. If
  calendar-kit is ever dropped (ADR 019 revisit), these + a Reanimated grid become the
  renderer behind the unchanged wrapper. Under the `src/features/*/!(ui)/**` 90% glob.

## The domain `CalendarEvent` + the events-source seam

- **`data/types.ts` `CalendarEvent`** exposes `Date` timestamps + a `#RRGGBB` color and is
  **designed against the eventual sync model** — the sync-model fields
  (`allDay`/`teachers`/`tags`/`canceled`/`userCalendarId`) mirror the Flutter
  `calendar_event.toDbMap()` so the later sync ship's `calendar_events` table maps onto it
  with the ADR-011/018 importer-fidelity posture, **without a shape change** to any
  consumer. **Not persisted this ship.**
- **`data/events.ts` `useCalendarEvents(range): CalendarEvent[]`** is the **single
  events-source seam** — the screen must not know where events come from. This ship feeds
  it from a committed **dense-week fixture** (`data/fixtures.ts`, the spike's worst-case
  Tuesday 5-way cluster, anchored to the current week so it's always in range + Maestro
  reachable) merged with the existing **personal-events read** (`usePersonalEvents()` mapped
  `PersonalEvent → CalendarEvent`), range-filtered. **The later calendar-sync ship swaps the
  source here** (to the synced rows, or a merge) without changing the hook signature, the
  `CalendarEvent` shape, or any consumer — the swap is this one file; the fixture is
  removed / dev-gated then.

## The timeline screen — a brand surface (R-3)

- `src/features/calendar/ui/calendar-screen.tsx` (presentational, 70% floor): holds the view
  (day | week) + visible date, computes the range, reads through the sibling `data` sub-barrel
  (B-2), maps `CalendarEvent[] → EventItem[]`, and renders through `@/components/chrome`
  (`CalendarContainer` + `CalendarHeader` + `CalendarBody` with `showNowIndicator` +
  `renderEvent`). The `theme` is built from `@/theme` tokens (now-indicator → brand
  `primary`); `start`/`end` from the 7:00–21:00 time-grid constants; `numberOfDays` = 1 (day)
  / 5 (week, weekends-off default, Flutter parity). **Read-only — no write path.**
- **a11y:** the title is a `ThemedText type="title"` heading; the day/week switch is two
  `accessibilityRole="tab"` controls with translated labels + `accessibilityState.selected` +
  ≥44pt targets; each event tile is an accessible element with a translated label (title +
  time + location); the empty-range state uses a polite live region. Below `MIN_TILE_WIDTH`
  the tile text is hidden (the column is too narrow).
- A thin route `src/app/calendar.tsx` re-exports the screen through the `ui/` sub-barrel
  (route-structure rule), registered as a `<Stack.Screen name="calendar" />` sibling of
  `(tabs)` — reachable for deep-link/Maestro. Tab placement is the later home item's call.

## Observability ➖ N/A

A read-only render has **no crash-worthy write/throw path** to record (mirroring the
school-selection read path) — a failed events read would be a recoverable UI state, and
this ship's source is a fixture + a local read, neither of which throws crash-worthily. The
app imports no `@react-native-firebase/*` directly anywhere it adds.

## What CI proves vs. what's on-device

- **CI proves OUR wiring** (D7): the salvaged primitives + the events-source seam are
  unit-tested at 90% (pure / a mocked `usePersonalEvents`); the screen test renders through
  real theme + i18n with the **calendar-kit grid mocked suite-wide**
  (`jest/setup-calendar-kit.ts` — the mocked `CalendarBody` invokes `renderEvent` per event)
  so the event→tile wiring + the `CalendarEvent`→`EventItem` mapping + theme/label plumbing
  are provable without the Reanimated grid. Same posture as the `@expo/ui` picker (CI proves
  wiring, not the native control).
- **On-device (manual, inboxed) — CI cannot drive the Reanimated grid or measure on
  hardware:** the dense-overlap visual correctness + the **low-end-Android frame-rate bar +
  Reassure baselines** (ADR 019's exit-criterion gate, real hardware —
  `inbox/2026-06-16-calendar-low-end-android-perf.md`) and the **brand visual review** on
  both platforms (DoD native-correctness — `inbox/2026-06-16-calendar-visual-brand-review.md`).
- **Maestro** (`.maestro/calendar.yaml`) deep-links `timecalendar-dev://calendar` and asserts
  the screen renders + a committed fixture event title is visible (reachable with no seeded
  backend — sync isn't built). Not the dense-overlap packing or frame rate.

## Deferred (recorded debt — not built this ship)

- **The agenda/planning list view** — the scoped follow-up `add-mobile-calendar-agenda`, a
  `FlashList`/`SectionList` of day-grouped events over the **same salvaged primitives** this
  ship lands (ADR 019's "easy half").
- **Calendar sync** — `POST /calendars/sync` → a Drizzle `calendar_events` table; swaps the
  `useCalendarEvents` source behind the unchanged seam.
- **The home today mini-grid**, event details, weekends-toggle / persisted view preference —
  later Phase-04 items; the home grid reuses the salvaged overlap engine.
