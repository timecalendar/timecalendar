## Why

The Activity native E2E proof clears Android app data and cold-opens the development import link, exposing a startup race: the import can resolve its server token and write `user_calendars` while the root's fire-and-forget Drizzle migration is still creating that table. Android then remains on the dev-import error surface instead of reaching Calendar, even though the seeded server and deep link are available.

## What Changes

- Make the mobile migration runner join concurrent callers so startup and a storage-dependent cold route cannot execute overlapping migration attempts.
- Make the import-by-token data seam await migration completion before resolving, persisting, or syncing a calendar.
- Add focused tests that hold migration completion pending and prove the import does not issue its server request or touch durable storage early, then completes exactly once after readiness.
- Preserve the existing Activity Maestro flow, its `clearState`/cold-link lifecycle, the local development backend, and every terminal assertion; the exact implementation head must pass `Run mobile E2E (Android)` in CI.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-storage`: Concurrent migration callers share the active startup migration attempt so storage-dependent work can await readiness without overlapping the runner.
- `mobile-calendar-import-token`: The development import-by-token path waits for migrations before the token request and durable write, including on a fresh Android app-data state.

## Impact

- Expected code: `mobile/src/db/migrate.ts`, its focused test, and the calendar-import token data seam/tests.
- Verification: focused mobile Jest suites, the mobile static gates, OpenSpec validation, and the existing exact-head Android native E2E job.
- No API/OpenAPI or generated-client change, database schema/migration change, dependency upgrade, backend lifecycle change, workflow edit, Maestro retry/sleep/assertion change, native/store/EAS/Firebase config change, Architecture Book edit, infrastructure change, or legacy Flutter change.
- Sensitive surfaces touched: none. If implementation requires any issue-declared sensitive or out-of-scope surface, stop and return the finding to the Founding Engineer.
