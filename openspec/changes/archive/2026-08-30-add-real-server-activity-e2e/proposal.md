## Why

Activity's server endpoint, SQLite cache, screen, and trigger wiring are individually tested, but
no shipped check proves that they work together against the real NestJS/Postgres contract. This
change closes that gap with deterministic local-server fixtures, a cross-platform Maestro journey,
restart/removal integration coverage, and executable device instructions.

## What Changes

- Extend the `NODE_ENV=test` E2E seed with two dedicated token-addressable Activity calendars: an
  older baseline and a newer 52-log fixture. The newer fixture covers new, changed, cancelled,
  unread, multi-page, and same-timestamp rows split across the 50-row page boundary.
- Add a focused server integration proof that the seeded calendars are repeatable and that
  `POST /v1/calendar-logs/search` returns the expected unread count, stable first/older pages, and
  ID tie-break order through the same endpoint Maestro will call.
- Add one shared iOS/Android Maestro flow that establishes the baseline read watermark, imports and
  synchronizes the newer fixture without clearing device state, observes and clears the Settings
  badge, exercises new/changed routing and cancelled-item inertness, pulls to refresh, and scrolls
  until the older page appears.
- Add React Native integration coverage that a process restart can render cached history while the
  refresh request fails, and that an observed calendar removal deletes only that calendar's cached
  Activity history.
- Add a `(HUMAN: ...)` migration-inbox runbook for foreground, push, scrolling, and form-factor
  checks on real iOS and Android devices. This note is evidence to collect later, never a blocker.
- Update the Architecture Book's testing page and changelog with the reusable staged-Activity-seed
  pattern and the exact verification boundary on this no-KVM host.
- **No API, generated-client, database migration, production fixture, or Flutter change.**

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `e2e-server-lifecycle`: the isolated test database gains deterministic staged Activity calendars
  and calendar-log rows while retaining the existing `db:init` lifecycle.
- `mobile-e2e`: the real-round-trip suite gains an Activity journey covering unread state,
  pagination, navigation, inert cancellation, and refresh against the harness-managed server.

## Impact

- **Server seed and proof:** `server/src/scripts/seed-e2e-calendar.ts` (or a sibling helper owned by
  that seed) plus a colocated Jest integration test. The production seed path remains unchanged;
  these rows exist only when `NODE_ENV=test` invokes the established E2E seed.
- **Mobile integration and E2E:** `mobile/src/features/activity/**` tests,
  `mobile/.maestro/activity.yaml` plus any nested Activity-only import subflow, and the existing
  selector-drift proof when a new stable testID is required.
- **Documentation:** `docs/mobile/architecture-book/testing.md`, its `CHANGELOG.md`,
  `mobile/e2e/README.md`, and one `docs/react-native-migration/inbox/` device runbook.
- **Sensitive surfaces:** `ci/e2e-server.sh` and `.github/workflows/` are relied on but are not
  planned edits; the seed remains additive behind their current lifecycle. If implementation needs
  to modify either surface, the Applier must stop and return the scope change to the Founding
  Engineer. `openapi/openapi.json`, `mobile/src/api/generated/`, `server/src/migrations/`, native
  config, deployment infrastructure, and legacy `app/` are untouched.
- **Native verification:** this host has no KVM or iOS simulator. Local work proves the seed,
  integration tests, syntax/selectors, TypeScript, lint, Jest, and coverage; the ticket and PR must
  state that Maestro was not run here. Per board policy, do not add `run-e2e`; definitive native
  execution occurs on the post-merge `main` workflow.
