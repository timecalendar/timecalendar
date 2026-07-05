# Tasks

Phased to the recommended two-PR split (design Decision 6). **Phase 1–5 = PR 1** (the seam +
`calendar.yaml` anchor proof). **Phase 6 = PR 2** (the remaining three flows +
documentation finalization). A single PR is acceptable but two is recommended.

## 1. Server — enrich the E2E seed (today-anchored dense-overlap cluster)

- [x] 1.1 In `server/src/scripts/seed-e2e-calendar.ts`, add a `today` anchor on `now`'s UTC
  day (reuse the existing UTC arithmetic; do NOT change `E2E_CALENDAR_TOKEN` /
  `E2E_CALENDAR_ID`).
- [x] 1.2 Add ≥2 **overlapping** timed events on today (e.g. 10:00–12:00 and 11:00–13:00) so
  the grid + home mini-timeline exercise column-packing.
- [x] 1.3 Add a stable uniquely-titled today event for the details/checklist flow (ASCII-safe,
  e.g. `E2E Today Lecture`) and a distinct stable today event for the hide/un-hide flow
  (e.g. `E2E Today Seminar`); keep the existing Mon/Tue/Wed week events.
- [x] 1.4 Correct the stale docstrings: remove the `calendar_flow_test.dart` / "Flutter side
  seeds a matching local `UserCalendar`" references (that harness is retired); document that
  the RN dev-import deep link is the mechanism and note the UTC-"today" caveat.
- [ ] 1.5 Verify the seed runs clean: `cd server && NODE_ENV=test npm run db:init` (or via
  `ci/e2e-server.sh up`) and confirm `POST /calendars/sync {tokens:["e2e-smoke-calendar"]}`
  returns the today-anchored + week events with a fresh `lastUpdatedAt` (no external fetch).
  <!-- Deferred: needs a project Postgres + test DB not provisioned in this apply
  env (booting docker is not required per the apply brief). `npx tsc --noEmit` on
  server passes; the CI e2e-server runs this seed on device. -->
- [x] 1.6 Confirm no OpenAPI drift (`server` `npm run generate:openapi` — the seed change
  touches no controller/DTO, so the committed spec must be unchanged). Verified by
  construction: the diff is confined to `CalendarEvent` seed-row content + docstrings; no
  controller, DTO, or decorator changed, so the committed spec is byte-identical.

## 2. Mobile — runtime variant seam

- [ ] 2.1 In `mobile/app.config.ts`, add `extra.appVariant: IS_DEV ? "development" :
  "production"` alongside the existing `extra.eas` (do NOT bump the fingerprint — pure JS
  config).
- [ ] 2.2 Add a single variant-read helper (e.g. `mobile/src/config/variant.ts`
  `isDevVariant()`) reading `Constants.expoConfig?.extra?.appVariant === "development"`
  (`expo-constants` is already a dep). Unit-test both branches.

## 3. Mobile — addCalendarFromToken data seam (B-1, data/-only)

- [ ] 3.1 Add `addCalendarFromToken(token)` in
  `mobile/src/features/calendar-sources/data/user-calendars/` (in `add-calendar.ts` or a
  sibling `add-from-token.ts`): `calendarControllerFindCalendarByToken(token)` →
  `fromCalendarForPublic(dto)` → `upsert(...)` — the resolve+upsert half of
  `addCalendarFromUrl`, no create-`POST`. Keep the generated-client call inside `data/`.
- [ ] 3.2 Export `addCalendarFromToken` from the `user-calendars` data sub-barrel and the
  `calendar-sources` feature barrel (via `./data`).
- [ ] 3.3 Unit-test it at the `customFetch` + `@/db` seams: success writes a row (the `@/db`
  query-builder spy), and a resolve/upsert failure rejects. Clear the 90% `data/` gate.

## 4. Mobile — the dev-import deep-link route

- [ ] 4.1 Create the screen in a feature `ui/` sublayer (e.g. a `dev-import` feature folder or
  under `calendar-sources/ui/`) — presentational, reading the `token` param via
  `useLocalSearchParams`, gated on `isDevVariant()`.
- [ ] 4.2 Dev branch: call `addCalendarFromToken(token)` → trigger `useSyncCalendars().sync()`
  → `router.replace("/calendar")`; own local `{ pending, error }` and surface an accessible
  failure on reject (record through `@/firebase`).
- [ ] 4.3 Production branch: render an inert, accessible "not available" state; make NO
  import/network call.
- [ ] 4.4 Add the thin route re-export `mobile/src/app/dev-import.tsx` (a `Stack` sibling of
  `(tabs)`) exporting the screen from the feature `ui/` sub-barrel (route-structure rule).
- [ ] 4.5 Add all new user-facing strings to the i18n catalogs (FR + EN, typed-key parity) —
  the "not available" state, any loading/error text. No hardcoded strings (lint-enforced).
- [ ] 4.6 a11y props on the screen (roles/labels, live-region on the error), ≥44pt/48dp
  targets where interactive.
- [ ] 4.7 Screen test (colocated in `ui/`, NOT under `src/app/`): asserts the dev branch
  imports+syncs+routes (mocking the data seam + variant helper) and the **production branch
  performs no import** and shows the inert state. Meet the 70% floor.

## 5. E2E — the shared import preamble + the calendar anchor flow (PR 1 proof)

- [ ] 5.1 Add `mobile/.maestro/import-seed.yaml` — a shared `runFlow` subflow that
  cold-starts (`stopApp`), opens
  `timecalendar-dev://dev-import?token=e2e-smoke-calendar`, handles the iOS first-deep-link
  "Open" optional tap, and waits until the import+sync has landed on the calendar.
- [ ] 5.2 Rewrite `mobile/.maestro/calendar.yaml`: run the import preamble, assert a seeded
  event title renders on the calendar surface (a real tile), then `tapOn` that title →
  assert the event-details screen shows real content (NOT the not-found message). Remove the
  reachability-only steps and the "SEEDED-DATA LIMITATION" header; rewrite the header to the
  real round-trip. Keep the generous `extendedWaitUntil` timeouts + cross-platform text.
- [ ] 5.3 Add any stable additive testIDs the calendar flow needs (e.g. a `calendar-empty`
  marker so the empty→populated transition is assertable) — additive only, no behaviour
  change; add matching screen-test coverage for the new testID if it gates logic.

## 6. E2E — the remaining three flows + documentation (PR 2)

- [ ] 6.1 Rewrite `mobile/.maestro/home.yaml`: import preamble → assert a today-anchored
  seeded event's title on the today timeline (not the empty-day state). Rewrite the header.
- [ ] 6.2 Rewrite `mobile/.maestro/event-checklists.yaml`: import preamble → open a seeded
  synced event's details → `tapOn: id: checklist-add` → type content into the checklist
  input → assert the content is visible → toggle → delete → assert it is gone. Round-trips
  the real `checklist_items` store. Rewrite the header.
- [ ] 6.3 Rewrite `mobile/.maestro/hidden-events.yaml`: import preamble → open a seeded synced
  event's details → hide it (the localized Alert chooser "hide this event") → assert it is
  absent from the views → open `timecalendar-dev://hidden-events` → assert it is listed →
  un-hide → assert it reappears; leave the hidden set restored. Rewrite the header.
- [ ] 6.4 Update `mobile/e2e/README.md` "add a flow" section: the seeded-token import
  preamble is the new pattern; note the UTC-"today" local-run caveat.
- [ ] 6.5 Write **ADR 030** (`docs/mobile/architecture-book/decisions/030-*.md`): the
  dev-only import deep link + the `Constants.expoConfig.extra.appVariant` runtime gate
  (context · choice · alternatives `__DEV__`/scheme-sniff/`expo-application`/build-time-strip ·
  revisit-if). Index it in `decisions/README.md`.
- [ ] 6.6 Update `docs/mobile/architecture-book/testing.md` "E2E — Maestro" to describe the
  seeded-token round-trip pattern (import preamble → real synced render), linking the new ADR.
- [ ] 6.7 Append a dated entry to
  `docs/mobile/architecture-book/architecture-changelog.md` (migration-approach §7 — a rule/
  pattern change is recorded).

## 7. Local verification (both PRs, before pushing)

- [ ] 7.1 `cd mobile && npx tsc --noEmit` — zero type errors.
- [ ] 7.2 `cd mobile && npm run lint` — passes incl. custom rules (no hardcoded strings,
  seam-import boundaries, feature boundaries), Prettier clean.
- [ ] 7.3 `cd mobile && npm test -- --coverage` — green; the new `data/` seam + variant helper
  clear the 90% logic gate, the new screen the 70% floor.
- [ ] 7.4 Confirm gen-drift clean (mobile `npm run generate` + server OpenAPI regen produce no
  diff — no client/spec change expected).

## 8. CI proof — the on-device E2E gate (the real proof)

- [ ] 8.1 Add the **`run-e2e` label** to each PR so `ci-mobile-e2e.yml` runs the flows on the
  Android emulator AND the iOS simulator (the flows are only fully verifiable on device; local
  Jest cannot assert the synced render).
- [ ] 8.2 Confirm `e2e-mobile-android` + `e2e-mobile-ios` are green: the rewritten flows import
  the seeded token, sync, and assert real synced data / round-trips on both platforms. (No
  rebuild step needed — the dev-variant binary is built per CI run via `expo prebuild`, so the
  new `dev-import` route ships automatically.)
- [ ] 8.3 If a flow flakes on timing, widen the first-synced-assertion `extendedWaitUntil`
  before merging (do not weaken the assertion to an empty/reachability state — that would
  reintroduce the gap this change closes).

## 9. DoD close-out

- [ ] 9.1 Walk the Definition of Done for the affected features (calendar / home /
  event-details / event-checklists / hidden-events): the **E2E axis** flips from
  reachability-only to real-round-trip green on both platforms; every other axis stays green or
  N/A-with-reason. Record the E2E-axis upgrade against those features.
- [ ] 9.2 Confirm production safety: a unit test proves the production branch of the import
  route performs no import (the security boundary is the runtime gate, not the scheme).
