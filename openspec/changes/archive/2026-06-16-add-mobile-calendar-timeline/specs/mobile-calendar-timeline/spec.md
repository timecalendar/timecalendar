## ADDED Requirements

### Requirement: Calendar-kit dependency, pure-JS, no native footprint

The mobile app SHALL add `@howljs/calendar-kit` (Expo SDK 56-aligned) as the day/week timeline
renderer. It is pure-JS: it SHALL NOT add native code, an `app.config.ts` config plugin, or bump the
EAS runtime fingerprint.

#### Scenario: calendar-kit is declared and pure-JS

- **WHEN** `mobile/package.json` is inspected
- **THEN** it declares `@howljs/calendar-kit` at the SDK-56-aligned version and the lockfile is consistent
- **AND** no new `app.config.ts` `plugins` entry is added for it
- **AND** the change adds no native module that would change the EAS fingerprint (it rides the OTA lane)

### Requirement: GestureHandlerRootView mounted at the app root

The app root layout SHALL mount a `GestureHandlerRootView` (from the already-present
`react-native-gesture-handler`) as the outermost wrapper, because calendar-kit requires it.

#### Scenario: Root layout wraps the tree in GestureHandlerRootView

- **WHEN** `src/app/_layout.tsx` is inspected
- **THEN** a `GestureHandlerRootView` with `style={{ flex: 1 }}` wraps the provider/Stack tree
- **AND** the app launches and the existing test suite stays green

### Requirement: Calendar-kit is reached only through a chrome-wrapper seam

`@howljs/calendar-kit` SHALL be imported only inside the chrome wrapper
`src/components/chrome/calendar-kit.tsx`; feature/screen/route code SHALL consume the calendar surface
through `@/components/chrome`, never the library directly. The boundary SHALL be lint-enforced.

#### Scenario: Single import site

- **WHEN** the codebase is searched for `@howljs/calendar-kit` imports
- **THEN** the only import site is `src/components/chrome/calendar-kit.tsx`
- **AND** the chrome barrel re-exports the calendar surface the screen needs under a stable local API

#### Scenario: Lint bans the library outside the chrome seam

- **WHEN** `mobile/eslint.config.js` is inspected
- **THEN** `no-restricted-imports` bans `@howljs/calendar-kit` everywhere except `src/components/chrome/**`
- **AND** the ban is re-set off for the chrome seam dir (mirroring the `@expo/ui` ban)
- **AND** an import of the library from outside the chrome dir fails lint with a message naming the seam

#### Scenario: Swap reversibility is localized

- **WHEN** a future fork or custom renderer replaces calendar-kit (ADR 019 revisit)
- **THEN** the swap is localized to `src/components/chrome/calendar-kit.tsx`, leaving the wrapper API and every consumer unchanged

### Requirement: Salvaged overlap-layout engine, pure and 90%-gated

The feature `data/` sublayer SHALL own a pure overlap-layout function (ported + validated in the spike
from the Flutter `EventForUI.listFromEvents`) that packs overlapping intervals into the minimum
unbounded number of columns and assigns fractional horizontal positions. It SHALL be unit-tested to the
90% logic threshold and SHALL import no React, no calendar-kit, no `@/db`, and no translation function.

#### Scenario: Disjoint intervals share one column

- **WHEN** non-overlapping intervals are laid out
- **THEN** each gets `columns = 1` and spans the full width (`startX = 0`, `endX = 1`)

#### Scenario: Classic three-way overlap splits into exact thirds

- **WHEN** three mutually overlapping intervals A/B/C are laid out
- **THEN** they are placed in three columns and each spans exactly one third of the width

#### Scenario: Five-way cluster packs into five even columns

- **WHEN** five mutually overlapping intervals are laid out
- **THEN** they pack into five columns, each one fifth of the width

#### Scenario: A freed column is reused

- **WHEN** an interval ends before a later overlapping interval starts in the same cluster
- **THEN** the later interval reuses the freed column rather than forcing a new one

#### Scenario: The engine is pure

- **WHEN** the engine is unit-tested
- **THEN** it runs without rendering, without a backend, and without a camera/clock, and clears the 90% logic gate

### Requirement: Salvaged time-grid math, pure and 90%-gated

The feature `data/` sublayer SHALL own pure time-grid math: minute→pixel position given a pixels-per-hour
and a day start-minute, event pixel height from a duration, the hour-label list for a `[start, end]`
window, and the now-indicator position. The Flutter-parity grid constants (7:00–21:00 window, 60px/hour
default, 50px hours column, 20px min tile width) SHALL be named constants, not magic numbers. It SHALL be
unit-tested to the 90% logic threshold and be pure (no React, no calendar-kit).

#### Scenario: Minute maps to pixel

- **WHEN** a time in minutes-from-midnight is converted with a given pixels-per-hour and day start-minute
- **THEN** the returned pixel offset is `(minutes - startMinute) / 60 * pixelsPerHour`

#### Scenario: Hour labels span the window

- **WHEN** the hour-label list is requested for the 7:00–21:00 window
- **THEN** it lists each hour boundary from the start hour to the end hour inclusive

#### Scenario: Now-indicator position

- **WHEN** the current time falls within the grid window
- **THEN** the now-indicator's pixel/fractional position matches the minute→pixel mapping for that time

#### Scenario: The math is pure

- **WHEN** the time-grid math is unit-tested
- **THEN** it runs without rendering and clears the 90% logic gate

### Requirement: Domain CalendarEvent type and events-source seam

The feature `data/` sublayer SHALL expose a `CalendarEvent` domain type (exposing `Date` timestamps and
a `#RRGGBB` color, with the sync-model fields designed in) and a single events-source hook
`useCalendarEvents(range)` returning `CalendarEvent[]` filtered to the range. The seam SHALL be the only
place the calendar's event source is determined, so calendar sync (a later ship) plugs in by swapping
only the source.

#### Scenario: CalendarEvent exposes domain types

- **WHEN** the `CalendarEvent` type is inspected
- **THEN** `startsAt`/`endsAt` are `Date`, `color` is a `#RRGGBB` string, and the sync-model fields (`allDay`, `teachers`, `tags`, `canceled`, `location`, `description`, `userCalendarId`) are present so the sync ship maps onto it without a shape change

#### Scenario: This ship feeds the seam from a fixture plus personal events

- **WHEN** `useCalendarEvents(range)` runs in this ship
- **THEN** it returns events drawn from a committed dense-week fixture merged with the existing personal-events read, mapped to `CalendarEvent` and filtered to the range
- **AND** no `calendar_events` table is created or read (that is the later sync ship)

#### Scenario: Range filtering

- **WHEN** a range `{ from, to }` is passed
- **THEN** only events intersecting the range are returned

#### Scenario: Sync plugs in behind the unchanged seam

- **WHEN** the later sync ship lands
- **THEN** it swaps `useCalendarEvents`'s source to the synced rows without changing the hook signature, the `CalendarEvent` shape, or any consumer

### Requirement: Day/week timeline screen as a brand surface

The feature `ui/` sublayer SHALL provide a read-only timeline screen rendering day and week views through
the chrome seam, as a designed brand surface themed from `@/theme` tokens (R-3 — the platform/brand is
the reference, not the Flutter pixels). It SHALL render the 7:00–21:00 grid, the now-indicator (brand
`primary`), overlapping events via `renderEvent`, and a day/week view switch. A thin route under
`src/app/` SHALL re-export it through the `ui/` sub-barrel and register it as a `Stack` sibling of the
tabs.

#### Scenario: Day and week views render

- **WHEN** the screen renders
- **THEN** it shows the timeline through the chrome seam with the 7:00–21:00 grid and the now-indicator
- **AND** a day/week view switch toggles between a single day and the multi-day week (default 5 days)

#### Scenario: Events render as themed tiles

- **WHEN** events are present in the visible range
- **THEN** each renders via `renderEvent` as a tile showing its title (and location when present), tinted by its `#RRGGBB` color, with overlaps packed into columns

#### Scenario: Theme comes from tokens

- **WHEN** the calendar `theme` is built
- **THEN** grid lines, hour labels, header, and the now-indicator derive from `@/theme` tokens (the now-indicator from the brand `primary`)

#### Scenario: Reachable via a thin route

- **WHEN** `timecalendar-dev://calendar` is opened
- **THEN** the timeline screen renders (the route is a thin re-export of the `ui/` screen, registered as a `Stack` sibling of `(tabs)`)

#### Scenario: Read-only, no write path

- **WHEN** the screen is used
- **THEN** it only reads and renders events (no create/edit/delete on this surface)

### Requirement: Internationalization and accessibility

Every user-facing string on the timeline screen SHALL be translated (FR + EN, no hardcoded strings), and
interactive controls, event tiles, and status SHALL be accessible.

#### Scenario: FR/EN parity

- **WHEN** the i18n catalogs are typechecked
- **THEN** every new key (view labels, day/week switch, empty state, accessibility labels) exists in both `en.json` and `fr.json` (bidirectional `tsc` parity)
- **AND** no user-facing string is hardcoded

#### Scenario: Accessible controls and tiles

- **WHEN** the screen renders
- **THEN** the title carries a heading role, the view-switch controls declare a role + translated label + ≥44pt/48dp target, each event tile is an accessible element with a translated label (title + time + location), and the empty-range state uses a polite live region

### Requirement: Wiring proven in CI grid and performance on-device

The change MUST prove the screen's event→tile wiring, the `CalendarEvent`→`EventItem` mapping, the
theme/label plumbing, the salvaged primitives, and the events-source seam by Jest (the calendar-kit grid
mocked suite-wide), and MUST record the dense-overlap visual correctness, the low-end-Android frame rate,
and the brand visual review as manual on-device verification (CI cannot drive the Reanimated grid).

#### Scenario: Screen wiring is proven without the real grid

- **WHEN** the screen test runs with the calendar-kit seam mocked (the mocked body invokes `renderEvent` per event)
- **THEN** a fixture event's tile renders with its translated label, the day/week switch is exercised, and localized text (not keys) is asserted

#### Scenario: Maestro asserts a fixture event renders

- **WHEN** the Maestro flow deep-links to the calendar
- **THEN** the timeline screen renders and a committed fixture event's title is visible (reachable with no seeded backend, since sync is not built)

#### Scenario: Perf and visual review are recorded as manual

- **WHEN** the change is reviewed for the performance and native-correctness DoD axes
- **THEN** the low-end-Android frame-rate + Reassure baseline pass and the brand visual review are captured in inbox notes (CI cannot assert them)

### Requirement: Observability is N/A for this read-only surface

This read-only rendering surface has no crash-worthy write/throw path, so the Observability DoD axis MUST
be marked N/A with a recorded reason, and the app SHALL NOT import `@react-native-firebase/*` directly
anywhere it adds.

#### Scenario: No write path to record

- **WHEN** the change is reviewed for the Observability DoD axis
- **THEN** it is marked N/A because the surface only reads and renders (a failed read is a recoverable UI state, not a recorded crash) — mirroring the school-selection read path
