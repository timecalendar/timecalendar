## Context

The root layout invokes `void runMigrations()` at module startup. That was harmless when the committed bundle was empty, but the bundle now creates `user_calendars` and other feature tables. The dev-import route mounts independently of that promise and its effect immediately calls `addCalendarFromToken`: a generated `GET /calendars/by-token/{token}` followed by a SQLite upsert, calendar sync, and `router.replace("/calendar")`.

The Activity Maestro setup is the reliable reproducer. It launches with `clearState: true`, stops the process, and cold-opens `timecalendar-dev://dev-import?token=e2e-activity-baseline`. In the exact Android artifact from GitHub Actions run `33409431164`, the screen reached the explicit `dev-import-error` presentation (“Could not import the calendar. Please try again.”), not a blank navigation state. iOS completed the same baseline import. The Android path is fast enough for the storage-dependent route effect to race the fire-and-forget migration.

The issue forbids changing the workflow, backend lifecycle, native/store config, generated API contract, migration bundle, Maestro assertions/retries, Architecture Book, or legacy Flutter. The repair must therefore coordinate the existing app-side operations and retain the real local server proof.

## Goals / Non-Goals

**Goals:**

- Guarantee that the dev-import resolve/upsert/sync sequence starts only after the process's current migration attempt settles.
- Prevent two callers from running Drizzle migration concurrently against the same SQLite handle.
- Retain the route's once-per-mount behavior, production runtime gate, existing persist seam, accessible error state, and final Calendar navigation.
- Prove the ordering with focused deterministic tests and preserve the unmodified Activity native flow as the CI proof.

**Non-Goals:**

- Redesign all startup readiness, splash behavior, or startup calendar sync.
- Change migration SQL, database schema, API endpoints, generated clients, server fixtures, backend environment selection, or local URL resolution.
- Add sleeps, retries, optional steps, or weaker Maestro assertions.
- Touch `.github/workflows/ci-mobile-e2e.yml`, `mobile/app.config.ts`, `mobile/eas.json`, `mobile/firebase/`, the Architecture Book, infrastructure, or legacy Flutter.

## Decisions

## Decision 1 — Make the migration runner single-flight while work is active

`runMigrations()` will keep a module-scoped in-flight promise. A caller that arrives during an active attempt receives that same promise; the slot clears when the attempt settles. The existing root fire-and-forget call remains, and a later storage-dependent caller can safely await the same work. Once no attempt is active, another call may invoke Drizzle again; its committed migration tracking makes that an idempotent no-op.

The existing failure contract remains: the runner records failures through `@/firebase` and settles. The dev-import path then either proceeds against the migrated schema or reaches its existing accessible error path if migration/storage remains broken. This change fixes ordering without introducing a second startup-failure UI or an unhandled rejection from the root's `void` call.

Alternative: cache one promise permanently for the JavaScript process. Rejected because it complicates isolated tests and prevents a later idempotent call from retrying after a failed attempt.

Alternative: allow both callers to invoke Drizzle independently. Rejected because awaiting a second migration does not prove the root migration has finished and overlapping schema operations create another race.

## Decision 2 — Await readiness inside the import-by-token data seam

`addCalendarFromToken` will await `runMigrations()` before calling the generated find-by-token function, mapping the DTO, or upserting `user_calendars`. The order becomes:

1. join/complete migrations;
2. `GET /calendars/by-token/{token}`;
3. `fromCalendarForPublic`;
4. durable `upsert`;
5. the existing screen-owned calendar sync;
6. the existing `router.replace("/calendar")`.

The wait belongs in the data seam because that seam owns the storage-dependent resolve/upsert operation. The route stays presentational, and every caller of the import-by-token operation receives the same readiness guarantee.

Alternative: await migrations directly in `DevImportScreen`. Rejected because it leaks database startup coordination into `ui/` and leaves the exported data operation unsafe when called elsewhere.

Alternative: add a fixed Maestro delay between `openLink` and the Calendar assertion. Rejected because the application can already enter a terminal error state; waiting longer cannot recover it and would weaken diagnosis.

Alternative: change `clearState`, skip the Activity setup, or retry the flow. Rejected because those choices hide the fresh-install race and violate the native proof.

## Decision 3 — Prove causal ordering locally and retain native proof unchanged

Focused Jest coverage will use a deferred migration promise. Before it resolves, assertions require zero token requests and zero upserts; after it resolves, the existing resolve/map/upsert chain runs once. A migration-runner test will invoke two callers concurrently and require one Drizzle call plus shared settlement. Existing production-inert, rerender, unmount, sync, and error tests remain intact.

No Maestro YAML changes are needed: `mobile/.maestro/activity/import-baseline.yaml` already reproduces the fresh Android lifecycle and asserts the expected Calendar landing. The implementation head must receive the existing `run-e2e` label/path and record a direct successful `Run mobile E2E (Android)` job link and exact SHA before review can complete.

Alternative: add a new Maestro-only diagnostic assertion for the error screen. Rejected because the acceptance criterion is successful Calendar landing; asserting the failure surface would normalize the regression.

## Risks / Trade-offs

- **[A second caller joins a migration failure and then proceeds]** → Preserve the existing observable failure contract; the subsequent storage operation rejects into the established accessible dev-import error state. A broader fatal-startup redesign is outside this ticket.
- **[The in-flight slot is cleared too early]** → Clear it only in `finally` on the exact shared promise and mutation-test the concurrent-call proof.
- **[The route starts twice after migration-driven rerenders]** → Keep the existing `startedRef` and mounted-ref behavior; add readiness below the data seam rather than adding screen state/effects.
- **[The repair accidentally bypasses the local backend]** → Keep the generated client and `customFetch` path unchanged and require the native flow to reach the seeded server and Calendar on the exact head.
- **[A supposedly small repair expands into a sensitive surface]** → Stop and return a scoped finding to the Founding Engineer before touching any issue-declared out-of-scope path.

## Migration Plan

Land the single-flight runner, the import-seam wait, and focused tests together. There is no data migration or rollout act. Rollback is a repository revert; it restores the race but does not transform or delete stored data.

## Open Questions

None. The captured Android error surface, current startup call graph, and existing idempotent Drizzle runner provide a bounded implementation path.
