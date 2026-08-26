## 1. Dev-import lifecycle correction

- [x] 1.1 In `mobile/src/features/calendar-sources/ui/dev-import-screen.tsx`, add mount-lifetime tracking whose cleanup runs only on actual component unmount, and use it to guard post-await navigation and error-state updates.
- [x] 1.2 Preserve the existing once-per-mount start guard and the import ordering `addCalendarFromToken(token)` → `sync()` → `router.replace("/calendar")`; do not remove effect dependencies or restart the import when `sync` changes identity.

## 2. Deterministic regression proof

- [x] 2.1 In `mobile/src/features/calendar-sources/ui/dev-import-screen.test.tsx`, add a deferred first `sync` callback and a replacement callback returned after rerender; resolve the first callback through RNTL `act` and assert navigation reaches `/calendar`.
- [x] 2.2 Assert the replacement callback is never invoked, retaining the existing success, production-runtime-gate, and failure coverage.
- [x] 2.3 Run the focused CI proof test: `cd mobile && npm test -- --runInBand src/features/calendar-sources/ui/dev-import-screen.test.tsx`.

## 3. Architecture and local-green verification

- [x] 3.1 Review `docs/mobile/architecture-book/testing.md`, `navigation.md`, `data.md`, and ADR 030 against the applied diff; record Architecture Book/ADR updates as N/A because this leaf fix changes no reusable rule or load-bearing decision and the issue restricts implementation to the two mobile files.
- [x] 3.2 Run `cd mobile && npx tsc --noEmit`, `npm run lint`, and `npx prettier --check src/features/calendar-sources/ui/dev-import-screen.tsx src/features/calendar-sources/ui/dev-import-screen.test.tsx`, then run `git diff --check` from the repository root.
- [x] 3.3 Confirm the final implementation diff contains only `mobile/src/features/calendar-sources/ui/dev-import-screen.tsx` and its colocated test, with no Maestro timeout/retry, onboarding/recovery, contract/generated API, schema, native config, CI/workflow, infrastructure, deploy, secret, or Flutter changes.
