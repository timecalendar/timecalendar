## MODIFIED Requirements

### Requirement: A dev-variant deep link imports a calendar by token into the durable token store

The app SHALL expose a deep-link route reachable as
`timecalendar-dev://dev-import?token=<token>` that, when the runtime variant is
`development`, reads the `token` query param, resolves the calendar
(`GET /calendars/by-token/{token}` via the committed generated client), maps the DTO with
`fromCalendarForPublic`, and `upsert`s a durable `user_calendars` row — reusing the existing
resolve+upsert persist chain (NOT a new persistence path). The route SHALL then trigger a
calendar sync and route to the calendar surface so the newly-held token's events sync and
render. An import SHALL start at most once per mounted screen instance, SHALL continue across
ordinary dependency-driven rerenders, and SHALL suppress post-await navigation or error-state
updates only after the screen actually unmounts. The resolve + `upsert` call SHALL stay inside
the `calendar-sources/data/` sublayer (B-1 — the generated-hook and durable-write seam is
`data/`-only).

#### Scenario: Importing a token holds it durably and syncs

- **WHEN** the dev-variant app opens `timecalendar-dev://dev-import?token=e2e-smoke-calendar`
  with the harness server running
- **THEN** the app resolves the calendar by token, upserts a `user_calendars` row for it,
  triggers a sync that fetches the seeded events via `POST /calendars/sync`, and routes to
  the calendar so the seeded events render

#### Scenario: An in-flight import survives a sync callback identity change

- **WHEN** the first sync is in flight and its mutation-driven rerender provides a different
  `sync` callback while the dev-import screen remains mounted
- **THEN** the first import completes and routes to `/calendar`, and the replacement callback
  does not start another import

#### Scenario: An actual unmount cancels post-await screen work

- **WHEN** the dev-import screen unmounts before its import or sync promise settles
- **THEN** the settled operation performs no navigation and no error-state update on the
  unmounted screen

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
