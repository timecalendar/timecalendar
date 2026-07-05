## ADDED Requirements

### Requirement: A dev-variant deep link imports a calendar by token into the durable token store

The app SHALL expose a deep-link route reachable as
`timecalendar-dev://dev-import?token=<token>` that, when the runtime variant is
`development`, reads the `token` query param, resolves the calendar
(`GET /calendars/by-token/{token}` via the committed generated client), maps the DTO with
`fromCalendarForPublic`, and `upsert`s a durable `user_calendars` row — reusing the existing
resolve+upsert persist chain (NOT a new persistence path). The route SHALL then trigger a
calendar sync and route to the calendar surface so the newly-held token's events sync and
render. The resolve + `upsert` call SHALL stay inside the `calendar-sources/data/` sublayer
(B-1 — the generated-hook and durable-write seam is `data/`-only).

#### Scenario: Importing a token holds it durably and syncs

- **WHEN** the dev-variant app opens `timecalendar-dev://dev-import?token=e2e-smoke-calendar`
  with the harness server running
- **THEN** the app resolves the calendar by token, upserts a `user_calendars` row for it,
  triggers a sync that fetches the seeded events via `POST /calendars/sync`, and routes to
  the calendar so the seeded events render

#### Scenario: The persist chain is the existing one, reused

- **WHEN** the import runs
- **THEN** it goes token → `GET /calendars/by-token/{token}` → `fromCalendarForPublic` →
  `upsert` (skipping the create-`POST` that `addCalendarFromUrl` does), reusing the
  `user_calendars` durable-write seam rather than introducing a second write path

#### Scenario: A resolve or upsert failure surfaces, not silently swallowed

- **WHEN** the resolve or upsert fails (bad token, server down, write error)
- **THEN** the import surfaces an accessible failure state and does not crash the launch (the
  promise rejects; the failure is recorded through `@/firebase` consistent with the existing
  persist seam)

### Requirement: The import action is inert in a production build

The import action SHALL be gated at runtime on the app variant, read from
`Constants.expoConfig?.extra?.appVariant` (a named `extra.appVariant` set in
`app.config.ts`). Because the route FILE ships in the production bundle (reachable as
`timecalendar://dev-import?token=…` even though the `timecalendar-dev` scheme does not exist
in production), the route SHALL, when the runtime variant is NOT `development`, perform NO
import — no token resolve, no upsert, no network call — and render an inert, accessible
"not available" state instead.

#### Scenario: Production performs no import

- **WHEN** a production-variant build reaches the dev-import route (e.g. via a
  `timecalendar://dev-import?token=…` link) with any token
- **THEN** no calendar is resolved, no `user_calendars` row is written, no network request is
  made, and an inert "not available" state renders

#### Scenario: The variant is read from a single named field

- **WHEN** the route decides whether to import
- **THEN** it reads the variant from `Constants.expoConfig?.extra?.appVariant` through a
  single helper (not `__DEV__`, which is false in the release-config e2e build; not an
  inferred scheme string), so the e2e release-config dev-variant build DOES import while
  production does not

### Requirement: A calendar can be added from a token through a data-layer seam

The `calendar-sources/data/user-calendars/` sublayer SHALL provide an `addCalendarFromToken`
seam that resolves a calendar by token and upserts it durably — the resolve+upsert half of
`addCalendarFromUrl` without the create-`POST`. It SHALL be exported from the `user-calendars`
data sub-barrel and the `calendar-sources` feature barrel, and SHALL be the only new
generated-client call site (kept in `data/`, B-1). It SHALL be covered by automated tests
under the coverage gate.

#### Scenario: addCalendarFromToken resolves and upserts

- **WHEN** `addCalendarFromToken("e2e-smoke-calendar")` runs
- **THEN** it calls `calendarControllerFindCalendarByToken`, maps via `fromCalendarForPublic`,
  and `upsert`s the resulting `UserCalendar`, with no create-`POST`

#### Scenario: The seam is unit-tested at the customFetch seam

- **WHEN** the mobile Jest suite runs
- **THEN** `addCalendarFromToken` is tested (success writing a row via the `@/db` spy, and a
  resolve/upsert failure rejecting) by mocking the `customFetch` mutator + the `@/db` seam,
  and clears the coverage gate

### Requirement: The import route is a thin re-export over a feature ui module

The route `src/app/dev-import.tsx` SHALL be a thin re-export of a screen living in a feature
`ui/` sublayer (route-structure rule — the colocated screen test lives outside `src/app/`),
and the route SHALL be a `Stack` sibling of `(tabs)` (deep-link target, navigation rule). The
screen SHALL be presentational, delegating the import to the `data/` seam.

#### Scenario: The route file is a one-line re-export

- **WHEN** the dev-import route is added
- **THEN** `src/app/dev-import.tsx` re-exports the screen from a feature `ui/` sub-barrel and
  holds no logic itself, and the screen's test lives with the screen (not under `src/app/`)
