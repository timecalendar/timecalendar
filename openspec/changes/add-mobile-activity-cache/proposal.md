## Why

React Native has no Activity history at all: no tables, no repository, no read state. The
Activity revival epic ([TIM-389]) ships a paginated timetable-change history in 4.0, and every
later ticket in that epic — the refresh coordinator (Ticket 4), the screen and the Settings
unread badge (Ticket 5), the trigger wiring (Ticket 6) — reads and writes through a local store
that does not exist yet.

Two properties make this the first ticket rather than a detail of the screen:

1. **The history must survive offline and across pages.** The server contract is a bounded,
   snapshot-bound keyset page (max 100 rows). A student's year of history therefore arrives as
   many pages over many sessions, so the cache is *incremental* — merged by log id, never
   replaced. That is the opposite posture from `calendar_events` (drop+replace), and it is the
   part that is easy to get wrong once a screen is pushing on it.
2. **Read state must not depend on the device clock.** Unread is "changes since I last looked".
   If "last looked" is a device timestamp, a phone whose clock is wrong permanently hides real
   changes or invents fake ones. The watermark is the server's `asOf`, never local `now` — a
   decision that has to be baked into the storage shape, not bolted on by the screen.

A SQLite migration ships to real devices and cannot be withdrawn by rolling back a JS bundle, so
the schema, the migration's behavior on an already-populated database, and the merge/prune
transaction are proven here, in isolation, before any network or UI code depends on them.

Specification: `docs/react-native-migration/05-tech-specs/activity-revival.md` at `595786a0`,
architecture decisions 5 and 8.

## What Changes

- **Two new tables.** `activity_logs` (one row per server `calendar_log`, keyed by the server id,
  indexed on `created_at` and `calendar_id`, structured change stored as defensively-decoded JSON
  text) and `activity_state` (a singleton row holding read watermark, unread count, freshness
  stamp, and older-page cursor). One additive Drizzle migration.
- **A real migration proof.** A test applies the *committed* migration bundle to an actual
  in-memory SQLite database via Node's built-in `node:sqlite`: fresh-install creation, and an
  upgrade of a database already carrying rows in the four existing tables. No test in the repo
  does this today — `expo-sqlite` is mocked suite-wide, so migrations have never been executed in
  CI.
- **`@/db` seam extension.** Export the two tables and the three query operators the repository
  needs (`desc`, `lt`, `notInArray`); add both tables to `resetBackendDatabase()` so Activity
  clears with the other backend-bound data on an environment switch.
- **An Activity repository** (`src/features/activity/data/`) with: total, defensive row↔domain
  mapping (a malformed cached change is skipped, never thrown); one synchronous transaction that
  upserts a page by log id, prunes rows older than one year *relative to the latest trusted server
  snapshot*, drops rows for calendars the device no longer holds, and advances the cursor and
  metadata only after the writes succeed; calendar-removal deletion; read-watermark operations;
  and cursor recovery that resets the pagination chain without deleting cached rows.
- **Shared fake-db extension.** `@/test-support/fake-db` gains `desc`, `lt`, `notInArray`,
  multi-key ordering, and where-less delete inside a transaction, so the Activity repository tests
  reuse the shared harness instead of hand-rolling a fifth `jest.mock("@/db")` factory.
- **Book + map.** New ADR 045 (incremental cache + server-time watermark), `storage.md` tables and
  reset list, `features.md` Activity row and cross-feature contract, dated changelog entry.
- **NOT changed:** no HTTP request, no generated client, no screen, no route, no Settings entry, no
  Flutter cache import, no historical event-snapshot model, no server code.

## Capabilities

### New Capabilities

- `mobile-activity-cache`: a device-local, incremental Activity history cache with server-time read
  state — page merge by server log id, one-year retention against the latest trusted server
  snapshot, calendar-removal cleanup, cursor persistence and recovery, and total defensive decoding
  of cached structured changes.

### Modified Capabilities

- `mobile-storage`: the `@/db` backend reset operation covers the two Activity tables alongside the
  existing four, and the seam exposes the ordering/comparison operators the incremental cache needs.

## Impact

- **Code:** `mobile/src/db/schema.ts`, `mobile/src/db/index.ts`, `mobile/src/db/reset.ts`, a new
  `mobile/src/db/migrations/0004_*.sql` + meta + bundle entry, and a new
  `mobile/src/features/activity/` module (`data/types.ts`, `data/repository.ts`, `data/index.ts`,
  `index.ts`). `mobile/src/test-support/fake-db.ts` extended additively.
- **Tests:** real-SQLite migration test (fresh + upgrade), mapper round-trip and corruption tests,
  repository transaction/idempotency/prune/removal/cursor tests, and the updated `@/db` reset test.
- **Docs:** ADR 045, `storage.md`, `features.md`, `architecture-changelog.md`.
- **Dependencies / native:** none. `node:sqlite` is a Node 24 built-in and the repo's `.nvmrc`
  already pins 24.13.0 (verified: it imports, typechecks, lints, and runs under the jest-expo
  preset in this worktree).
- **Sensitive surface — `mobile/src/db/` schema and migrations.** A SQLite migration reaches real
  devices and no JS-bundle rollback removes it. The migration is purely additive (two `CREATE
  TABLE` plus two `CREATE INDEX`, no alteration of an existing table) and both the fresh-install
  and already-populated paths are executed against real SQLite in CI.
- **Sensitive surface — `docs/mobile/architecture-book/`.** The cache and watermark record lands as
  ADR 045 plus a `storage.md` update in this PR (Architecture Book R-1).
- **Risk:** the pruning cutoff and the read watermark are both derived from server time. If a later
  ticket ever passes a device timestamp into either, the failure is silent (history quietly
  disappearing, or unread counts that never clear). The repository therefore takes server time as
  an explicit named input and never reads a clock itself, and the tests assert that a wrong device
  clock changes nothing.
