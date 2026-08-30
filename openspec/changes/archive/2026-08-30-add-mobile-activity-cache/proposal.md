## Why

React Native has no Activity history. The server already writes `calendar_log` rows in the calendar-sync transaction and keeps one year of them, but the app cannot show a student what changed in their timetable — the Flutter implementation has been hard-disabled since the commit that introduced it (TIM-275: held back for server capacity, not for a privacy or UX defect).

The [Activity revival specification](../../../docs/react-native-migration/05-tech-specs/activity-revival.md) splits the revival into eight tickets. This change is **Ticket 3**: the device-local half. It is deliberately dependency-free — it uses the DTO shape frozen in the specification, not Ticket 2's generated client, so it ships in parallel with the server work.

Two properties make this a data-model change rather than "another cache table":

1. **It must be incremental.** Every other server-backed table in the app (`calendar_events`) is drop+replaced each sync (ADR 021). Activity cannot be: history is cursor-paginated, so a newest-page refresh that replaced the table would delete every older page the student already backfilled, and an offline student would see an empty timeline. The cache is merged by log ID, never replaced.
2. **Its read watermark must be server time.** Unread count is exact and device-local. If `lastReadAt` came from the device clock, a phone whose clock is set forward permanently hides every subsequent change; set backward, it re-marks read history as unread forever. The watermark is the server-issued `asOf` (specification, architecture decision 8).

Neither property is derivable from the code that lands, so both are recorded as an ADR.

## What Changes

- **Two Drizzle tables + one additive migration.** `activity_logs` (server log id as primary key; `calendarId`, `calendarName`, `changeJson`, `createdAt`, `updatedAt`) indexed on `created_at` and `calendar_id`; `activity_state` (singleton row `id = 1`) holding `lastReadAt`, `unreadCount`, `lastSuccessfulRefreshAt`, `olderPageCursor`, `olderPageComplete`.
- **`@/db` seam extension.** The two tables and the query operators the Activity repository needs (`desc`, `and`, `lt`, `notInArray`) are re-exported; `resetBackendDatabaseWith` deletes both new tables inside the existing single synchronous reset transaction, so the environment-switch reset covers them with no second list to keep in sync.
- **Pure, defensive row↔domain mappers.** `changeJson` is plain TEXT holding JSON, decoded by hand (the ADR 021 posture, not Drizzle `mode: "json"`): a malformed row decodes to `null` and is **skipped**, never fatal. The mappers stay pure — the repository owns recording the skip through `@/firebase` with a static context and a count, never row content.
- **A transactional Activity repository** (`src/features/activity/data/`) owning: page upsert by log id, one-year local pruning against the latest trusted server snapshot, removal of rows for calendars the device no longer holds, the older-page cursor lifecycle, and the server-time read watermark. Every page write is one synchronous transaction; the cursor advances only after the rows are stored.
- **A real-SQLite migration proof.** The committed migration SQL is applied to an in-memory `node:sqlite` database in Jest — both on a fresh install and, critically, **on top of an existing database seeded with rows in all four current tables** — proving the upgrade path a field device will actually take.
- **Shared fake-`@/db` extension.** `createFakeDb` gains `desc`/`and`/`lt`/`notInArray` and multi-key ordering so the Activity repository is provable against the shared harness instead of a new hand-rolled mock. Existing `eq`/`asc` behavior is unchanged.
- **Book:** a new ADR for the two load-bearing decisions above, plus `storage.md` (tables, durability, reset), `features.md` (the `activity` feature row), and a dated `CHANGELOG.md` entry.

## Capabilities

### New Capabilities
- `mobile-activity-cache`: the device-local Activity model — an incremental, one-year, offline-readable cache of server calendar-log history keyed by server log id, plus device-local read and pagination state whose read watermark is server-issued time.

### Modified Capabilities
- `mobile-storage`: the `@/db` backend reset operation extends from four tables to six — `activity_logs` and `activity_state` are backend-bound rebuildable data cleared alongside calendar events and user calendars in the same synchronous transaction.

## Impact

- **Code:** `mobile/src/db/schema.ts` (two tables), `mobile/src/db/migrations/` (one generated migration + journal entry), `mobile/src/db/index.ts` (table + operator re-exports, reset wiring), `mobile/src/db/reset.ts` (two more deletes); new `mobile/src/features/activity/` (`data/` + feature barrel); `mobile/src/test-support/fake-db.ts` (operator/ordering support).
- **Tests:** a real-SQLite migration suite (fresh + upgrade-from-existing), pure mapper tests (round-trip + malformed JSON + unparseable dates), repository tests (transactional idempotent upsert, newest-first ordering, one-year prune, calendar removal, cursor lifecycle across a simulated restart, invalid-cursor recovery, read watermark), and the extended `@/db` reset test.
- **Docs:** new ADR, `storage.md`, `features.md`, `CHANGELOG.md`.
- **Not in scope:** any API request or generated-client use (Ticket 4), any screen or route (Ticket 5), trigger wiring into sync/push/foreground (Ticket 6), importing Flutter's `calendar_logs` cache (these tables are **not** Phase-09 import targets), and building a durable event snapshot from the historical payload (architecture decision 9).
- **Sensitive surfaces:** `mobile/src/db/` schema + migration runner — a migration that fails on an existing installed database is a data incident, which is why the upgrade path is proven against real SQLite rather than a mock. The environment-switch/reset path is the second: a table missing from the reset list leaves another environment's private schedule data on the device.
- **Dependencies / native / schema:** no new runtime dependency (`node:sqlite` is a Node built-in used only by the test), no native config change, no server or OpenAPI change.
