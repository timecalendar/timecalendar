## MODIFIED Requirements

### Requirement: Real-round-trip Maestro flow

The mobile app SHALL have Maestro flows that prove the app ↔ server contract end to end
against the harness-managed NestJS instance, with **nothing mocked**. In addition to the
`GET /schools` read, the calendar-family flows SHALL make the app durably hold the seeded
`e2e-smoke-calendar` token via the dev-variant import deep link
(`timecalendar-dev://dev-import?token=e2e-smoke-calendar`), trigger a sync, and assert that
**real seeded synced data renders** — proving app → generated client → `customFetch` →
NestJS → Postgres for the calendar surface. Flows live in `mobile/.maestro/`, are shared
across platforms (stable seeded/localized text, no per-platform selectors), and preserve the
cold-start `stopApp`→`openLink` idiom with generous `extendedWaitUntil` timeouts. A shared
import preamble (`import-seed.yaml`) SHALL hold the single import-then-sync step the
calendar-family flows reuse.

#### Scenario: Seeded schools render through the generated client

- **WHEN** the Maestro flow launches the development-variant app and opens the
  `timecalendar-dev://schools` deep link with the harness server running
- **THEN** the schools screen fetches via the generated Orval hook through `customFetch`, and
  the flow asserts a seeded school's name is visible — failing if the endpoint, its DTO, the
  generated client, or the QueryClient wiring is broken

#### Scenario: The seeded calendar token is imported and its events sync

- **WHEN** a calendar-family flow runs the import preamble (opens
  `timecalendar-dev://dev-import?token=e2e-smoke-calendar`) with the harness server running
- **THEN** the app resolves the token, holds it in `user_calendars`, syncs the seeded events,
  and the seeded synced data becomes renderable in the calendar/home/details views —
  no reliance on empty/not-found states

## ADDED Requirements

### Requirement: The calendar flow asserts a real synced tile and real event details

The `calendar.yaml` flow SHALL, after importing the seeded token, assert that a seeded synced
event's title renders on the calendar surface (a real tile, not the empty state), and that
tapping that event opens the event-details screen showing **real content** (the seeded title
/ a content line) — NOT the "no longer available" not-found message. This SHALL replace the
prior reachability-only assertions (empty state + a deep-linked not-found details route). The
flow's header comment SHALL be rewritten to describe the real round-trip (the
"SEEDED-DATA LIMITATION" note removed).

#### Scenario: A synced tile renders on the calendar

- **WHEN** the calendar flow imports the seeded token and opens the calendar
- **THEN** a seeded event's title is visible on the rendered calendar surface

#### Scenario: Tapping a synced event opens real details

- **WHEN** the flow taps the seeded event
- **THEN** the event-details screen shows the real seeded title/content, and the not-found
  message is NOT shown

### Requirement: The home flow asserts a populated today timeline

The `home.yaml` flow SHALL, after importing the seeded token, assert that a seeded event
anchored on **today** is visible on the Home tab's today timeline (a real tile, not the
empty-day state). This SHALL replace the prior empty-day reachability assertion. The header
comment SHALL be rewritten to the real round-trip.

#### Scenario: Today's seeded event renders on home

- **WHEN** the home flow imports the seeded token and lands on the Home tab
- **THEN** a today-anchored seeded event's title is visible on the today timeline, and the
  empty-day state is NOT the asserted state

### Requirement: The event-checklists flow round-trips a checklist through the real DB

The `event-checklists.yaml` flow SHALL, after importing the seeded token, open a real synced
event's details, add a checklist item, toggle it, and delete it — round-tripping through the
real device-local `checklist_items` store — asserting the typed content appears and then is
gone. This SHALL replace the prior not-found reachability assertion. The header comment SHALL
be rewritten to the real round-trip.

#### Scenario: A checklist item is added, toggled, and deleted on a real event

- **WHEN** the flow opens a seeded synced event's details, adds a checklist item with typed
  content, toggles it, and deletes it
- **THEN** the typed content is visible after add, the toggle is reflected, and the item is
  gone after delete — proving the write path against the real store

### Requirement: The hidden-events flow round-trips a hide/un-hide on a real synced event

The `hidden-events.yaml` flow SHALL, after importing the seeded token, hide a real synced
event from its details, assert it disappears from the views, open the hidden-events screen,
assert it is listed, un-hide it, and assert it reappears. This SHALL replace the prior
empty-state reachability assertion. The flow SHALL leave the hidden set restored (un-hidden)
at the end. The header comment SHALL be rewritten to the real round-trip.

#### Scenario: Hide then un-hide a real synced event

- **WHEN** the flow hides a seeded synced event from its details, then un-hides it in the
  hidden-events screen
- **THEN** the event is absent from the views while hidden, listed on the hidden-events
  screen, and visible again after un-hide

### Requirement: The rewritten flows stay cross-platform and cold-start-idiomatic

The rewritten flows SHALL remain shared across iOS and Android (localized/seeded text
assertions and platform-neutral testIDs only — no per-platform selectors), SHALL preserve the
`stopApp`→`openLink` cold-start idiom and the iOS first-deep-link "Open" confirmation
handling, and SHALL keep generous `extendedWaitUntil` timeouts around the first synced-data
assertion (to cover a release-config cold start plus the sync settle).

#### Scenario: A flow runs unchanged on both platforms

- **WHEN** any rewritten flow runs on the iOS simulator and the Android emulator in CI
- **THEN** it uses the same steps and text/testID assertions on both, with the cold-start
  `stopApp`→`openLink` preamble and the iOS "Open" optional tap
