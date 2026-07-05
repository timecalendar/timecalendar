# E2E seed fixture — real synced-calendar round-trips: a dev-only import deep link + a today-anchored seed cluster turn the 4 reachability-only Maestro flows into end-to-end proofs that real synced data renders

## Why

The mobile app (`mobile/`) has four Maestro E2E flows — `calendar.yaml`,
`event-checklists.yaml`, `hidden-events.yaml`, `home.yaml` — that today assert only
**empty / not-found** states. Each carries a "SEEDED-DATA LIMITATION" header conceding
it proves *reachability* (the route mounts, the migration runs, the screen degrades
safely) but **not** that real synced data renders. A regression that blanks the synced
calendar — a broken sync mapper, a dropped `POST /calendars/sync` DTO field, an
events-source merge bug — passes every gate today. The most important surface in the app
(the calendar the whole product exists to show) has **no end-to-end render proof**.

The root cause is a missing seam, not a missing fixture:

1. The startup sync (`mobile/src/features/calendar/data/sync/`) reads durable tokens from
   the local `user_calendars` SQLite table; **empty table → it NO-OPs, no request** (the
   correct Flutter-parity behaviour). On a fresh e2e launch that table is empty, so no
   sync happens and every view is empty.
2. The server **already** seeds a token-addressable calendar under `NODE_ENV=test`
   (`server/src/scripts/seed-e2e-calendar.ts`, run by `db:init`): a `Calendar` +
   `CalendarContent` under `E2E_CALENDAR_TOKEN = "e2e-smoke-calendar"` with three
   non-overlapping events anchored to Mon/Tue/Wed of the current UTC week. `POST
   /calendars/sync { tokens }` returns them with no external iCal fetch.
3. **There is no way for a Maestro flow to make the app durably HOLD that token**, so the
   seeded server data is never synced into the app.

The E2E harness rules already anticipate exactly this fix: `testing.md` describes the
blessed E2E as "opens a `timecalendar-dev://…` deep link and asserts **seeded data**
renders — proving app → generated client → `customFetch` → NestJS → Postgres end to end,
nothing mocked". This change closes the gap that keeps the four flows from meeting that
bar. It is a Phase-04/05 **DoD backfill**, not a new feature — the E2E axis for the
calendar/details/checklists/hidden/home features is finished honestly.

## What Changes

- **A dev-variant deep-link import seam.** A new stable deep link
  `timecalendar-dev://dev-import?token=<token>` (route `mobile/src/app/dev-import.tsx`)
  resolves a calendar by token and durably holds it: `GET /calendars/by-token/{token}` →
  `fromCalendarForPublic` → `upsert` into `user_calendars` (reusing the existing persist
  chain), then triggers a sync and routes to the calendar. A new `addCalendarFromToken`
  seam sits next to `useAddCalendar` in `calendar-sources/data/user-calendars/` — it
  skips the create-POST (we already have the token) and reuses the resolve+upsert half.
- **The import action is inert in production.** The `timecalendar-dev` *scheme* only
  exists in the dev variant, but the route *file* ships in the prod bundle (reachable
  under `timecalendar://`). The action is runtime-gated on the variant, read via
  `Constants.expoConfig?.extra?.appVariant` (a new `extra.appVariant` field in
  `app.config.ts`). In production the route renders an inert "not available" state and
  performs no import. **This is a load-bearing decision → new ADR.**
- **A today-anchored dense-overlap seed cluster.** `seed-e2e-calendar.ts` gains a small
  cluster of events anchored on **today** (`now`'s UTC day) with **≥2 overlapping**
  events (column-packing on the grid + the home mini-timeline), alongside the existing
  Mon/Tue/Wed week events, all with deterministic ASCII-safe titles/locations the flows
  assert. `E2E_CALENDAR_TOKEN` / `E2E_CALENDAR_ID` stay constant. Stale Flutter
  (`calendar_flow_test.dart`) docstring references are corrected.
- **The four flows become real round-trips.** Each starts by importing the seeded token
  via a shared `import-seed.yaml` `runFlow` preamble, then asserts real payload:
  `calendar.yaml` (a seeded tile renders + tap → real event-details), `home.yaml` (a
  seeded event on today's timeline), `event-checklists.yaml` (open a real event → add /
  toggle / delete a checklist item round-tripping through the DB),
  `hidden-events.yaml` (hide a real synced event → gone from views → un-hide → reappears).
  Their "SEEDED-DATA LIMITATION" headers are rewritten to the new reality.
- **Stable Maestro selectors where the flows need them.** Calendar-kit grid tiles have no
  per-event testID and Maestro taps by text — so tile assertion/tap is by seeded title
  text. Where a text tap is ambiguous or missing, add stable `testID`s (e.g. a
  `calendar-empty` marker) — additive, no behaviour change.

## Capabilities

### New Capabilities
- `mobile-calendar-import-token`: the dev-variant, runtime-gated deep-link seam that
  imports a calendar by token (resolve → durable `user_calendars` upsert → sync → route),
  inert in production — the missing piece that lets an E2E flow make the app hold a token.

### Modified Capabilities
- `mobile-e2e`: the real-round-trip E2E requirement grows from "at least one flow proves
  the schools read" to "the calendar/home/details/checklists/hidden flows import a seeded
  token and assert real synced data renders and round-trips" — a spec-level behaviour
  change to the flow set.
- `e2e-server-lifecycle`: the deterministic-seeded-state requirement grows to guarantee a
  **today-anchored, dense-overlap** synced cluster under the constant E2E token/id
  (previously only week-anchored, non-overlapping events).

## Impact

- **Mobile app code (dev-only path):** new `src/app/dev-import.tsx` route (thin
  re-export) + its `dev-import-screen` in a feature `ui/`; new
  `addCalendarFromToken` in `calendar-sources/data/user-calendars/`; a small
  runtime-variant helper reading `Constants.expoConfig`; new `extra.appVariant` in
  `app.config.ts`. No new npm dependency (`expo-constants` is already a dep). No native
  module, so **no EAS-fingerprint bump** — the dev-variant binary already installed in CI
  gains the new route automatically at the next `expo prebuild` build (which CI always
  does per run).
- **Server (test-only path):** `seed-e2e-calendar.ts` enrichment; runs only under
  `NODE_ENV=test` via `db:init`. No API/schema change — the sync endpoint and DTOs are
  untouched; only the seeded row content changes.
- **E2E harness:** the four rewritten flows + one shared `import-seed.yaml` subflow;
  `mobile/e2e/README.md` "add a flow" note refreshed. Full verification is on
  device/emulator (`ci-mobile-e2e.yml`, both platforms). Locally: Jest for the new
  `addCalendarFromToken` + variant-gate units, `tsc`, lint.
- **Architecture Book:** a new ADR (dev-only import + runtime variant gate); `testing.md`
  E2E section updated to describe the seeded-token round-trip pattern; the new ADR indexed
  in `decisions/README.md`; a `architecture-changelog.md` entry.
- **PR split (recommended — 2 PRs):** see design.md. PR 1 lands the **seam** (server seed
  enrichment + the import deep link + `calendar.yaml` as the anchor proof). PR 2 converts
  the remaining three flows (`home` / `event-checklists` / `hidden-events`) on top.
