## MODIFIED Requirements

### Requirement: A dev-variant deep link imports a calendar by token into the durable token store

The app SHALL expose a deep-link route reachable as
`timecalendar-dev://dev-import?token=<token>` that, when the runtime variant is
`development`, reads the `token` query param, resolves the calendar
(`GET /calendars/by-token/{token}` via the committed generated client), maps the DTO with
`fromCalendarForPublic`, and `upsert`s a durable `user_calendars` row — reusing the existing
resolve+upsert persist chain (NOT a new persistence path). The route SHALL then trigger a
calendar sync and route to the calendar surface so the newly-held token's events sync and
render. While the route remains mounted, reactive rerenders caused by the sync SHALL NOT
cancel this sequence; one successful import SHALL navigate to `/calendar` exactly once. A
genuine unmount SHALL suppress later navigation or state updates. The resolve + `upsert`
call SHALL stay inside the `calendar-sources/data/` sublayer (B-1 — the generated-hook and
durable-write seam is `data/`-only).

#### Scenario: Importing a token holds it durably and syncs

- **WHEN** the dev-variant app opens `timecalendar-dev://dev-import?token=e2e-smoke-calendar`
  with the harness server running
- **THEN** the app resolves the calendar by token, upserts a `user_calendars` row for it,
  triggers a sync that fetches the seeded events via `POST /calendars/sync`, and routes to
  the calendar exactly once so the seeded events render

#### Scenario: A source-health subscriber rerender does not cancel navigation

- **WHEN** the real sync hook writes a source-health snapshot while a reactive source-health
  subscriber is mounted in the production tree
- **THEN** the resulting synchronous rerender does not suppress the successful import's
  single navigation to `/calendar`

#### Scenario: A genuine unmount suppresses late effects

- **WHEN** the dev-import screen genuinely unmounts before its add or sync promise settles
- **THEN** completion does not navigate or update the unmounted screen

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

## ADDED Requirements

### Requirement: Dev-import rerender behavior is covered at the real sync boundary

The mobile integration suite SHALL render the dev-import screen with a mounted reactive
source-health subscriber and drive the real `useSyncCalendars` hook over the generated client
with `customFetch` mocked at the documented seam. The proof SHALL exercise the successful
SQLite event replacement and MMKV source-health write rather than mocking the sync hook.

#### Scenario: The regression test reproduces the production rerender path

- **WHEN** the generated sync mutation returns a calendar with events and source-health data
- **THEN** the test observes the real event/store writes, the subscriber rerender, and exactly
  one `/calendar` replacement
