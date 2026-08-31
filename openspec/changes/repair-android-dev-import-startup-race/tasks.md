## 1. Coordinate the migration runner

- [x] 1.1 Refactor `mobile/src/db/migrate.ts` so concurrent `runMigrations()` callers share the active promise, the slot clears only after settlement, and the existing idempotent later-call plus recorded non-throwing failure contracts remain intact.
- [x] 1.2 Extend `mobile/src/db/migrate.test.ts` with deferred, timer-free coverage proving two overlapping callers invoke Drizzle once, both settle together, a later call can run idempotently, and one shared failure is recorded once.

## 2. Gate the import-by-token data seam

- [x] 2.1 Make `addCalendarFromToken` await `runMigrations()` before the generated token resolve, mapper, or `user_calendars` upsert; retain the existing screen-owned runtime gate, once-per-mount effect, sync, navigation, and accessible failure behavior.
- [x] 2.2 Extend `add-from-token.test.ts` with a deferred migration proof that asserts no `customFetch` request or upsert occurs before migration settlement and exactly one existing resolve/map/upsert chain occurs afterward; retain resolve/upsert failure coverage.
- [x] 2.3 Run the focused Jest suites for `src/db/migrate.test.ts`, `src/features/calendar-sources/data/user-calendars/add-from-token.test.ts`, and `src/features/calendar-sources/ui/dev-import-screen.test.tsx`; confirm the production-inert and rerender/unmount contracts stay green.

## 3. Reconcile scope and architecture guidance

- [x] 3.1 Review the implemented diff against `architecture.md`, `storage.md`, `data.md`, `navigation.md`, `testing.md`, ADR 030, and the issue's sensitive-surface list; record that the repair applies existing migration/import rules and requires no Architecture Book or ADR update. If the implementation changes a documented contract or needs an out-of-scope surface, stop and return the scoped finding to the Founding Engineer before editing it.
- [x] 3.2 Confirm `.github/workflows/ci-mobile-e2e.yml`, `mobile/.maestro/activity.yaml`, `mobile/.maestro/activity/import-baseline.yaml`, backend lifecycle/fixtures, `mobile/app.config.ts`, `mobile/eas.json`, `mobile/firebase/`, API/OpenAPI/generated files, schema/migrations, infrastructure, and legacy Flutter are unchanged.

## 4. Local-green verification

- [x] 4.1 Run `cd mobile && npm run lint`, `npx tsc --noEmit`, and the proportionate mobile Jest command for the touched suites (expanding to the full mobile suite only if focused or coverage behavior requires it); fix the cause rather than weakening coverage or assertions.
- [x] 4.2 Run `openspec validate repair-android-dev-import-startup-race` and `git diff --check`; inspect the final diff for secrets, generated native output, debug artifacts, broad waits/retries, and unrelated changes.

## 5. Exact-head native CI proof

- [x] 5.1 Push the implementation head and run the existing on-demand native E2E path without workflow or flow changes; do not skip, optionalize, retry, or weaken any Activity assertion.
- [ ] 5.2 Confirm `Run mobile E2E (Android)` succeeds on the exact implementation SHA, including the baseline import reaching the seeded local server and landing on Calendar; record the direct successful job link and SHA in the issue/PR evidence before Reviewer handoff.
