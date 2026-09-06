## Why

Every dev-import-seeded Maestro flow has failed on **both** platforms since 2026-08-27, because the native E2E build talks to the **production** API instead of the seeded local server.

`app.config.ts` derives the backend-environment capability from `BACKEND_ENVIRONMENT_CAPABILITY` alone — by design it never falls back to `APP_VARIANT` — and an unset value parses to `production`, whose only allowed environment is `production`. `.github/workflows/ci-mobile-e2e.yml` is the one dev-variant build path that never set it: `package.json`'s `start`/`android`/`ios` scripts and all three `eas.json` profiles do. The E2E build therefore baked `EXPO_PUBLIC_API_URL` and then discarded it, resolving `PRODUCTION_API_URL` instead.

The dev-import deep link consequently asks the live API for a seeded E2E token. Measured against both hosts:

| token | local seeded backend | production API |
| --- | --- | --- |
| `e2e-smoke-calendar` | 200 | 404 |
| `e2e-activity-baseline` | 200 | 404 |

The 404 becomes an `ApiError`, `addCalendarFromToken` rejects, and the screen renders `dev-import-error` — the state captured in the Maestro hierarchy at the moment of every 60s timeout. Nothing was ever going to make `Calendar` appear.

This is not Android-only, not Activity-specific, and not caused by this branch. Run `32999041121` (2026-08-26, before the backend-environment selector landed) shows `Run import-seed.yaml... COMPLETED` with token `e2e-smoke-calendar`; run `33297815810` (2026-08-30) shows the same flow, same token, failing at the same assertion. The Activity flows added in `695e3104` were merged into an already-broken preamble and have never been green.

## What Changes

- Pair `BACKEND_ENVIRONMENT_CAPABILITY: development` with the baked `EXPO_PUBLIC_API_URL` on both platforms' prebuild and release-build steps, so the E2E binary is authorized to select the `local` environment it was pointed at.
- Tighten the `mobile-e2e` "E2E builds reach the local server" requirement, which specified the baked URL but not the capability that makes it reachable — the gap the regression walked through.
- Add a focused test that runs the real resolver over the real workflow, so the guard fails on the consequence (the app resolving to production) rather than on the presence of a string.
- Retain the migration hardening already on this branch — a single-flight `runMigrations()` and an import seam that awaits schema readiness — on its own correctness merits. It does **not** fix this failure and is no longer claimed to.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: an e2e build must both bake the local base URL and carry the development capability that authorizes selecting it.
- `mobile-storage`: concurrent migration callers share the active startup migration attempt so storage-dependent work can await readiness without overlapping the runner.
- `mobile-calendar-import-token`: the development import-by-token path waits for migrations before the token request and durable write.

## Impact

- Expected code: `.github/workflows/ci-mobile-e2e.yml`, `mobile/ci-e2e-build-env.test.ts`, and the migration/import-seam changes already on the branch.
- **Sensitive surface touched: `.github/workflows/ci-mobile-e2e.yml`.** The issue lists it out of scope and directs that diagnosis requiring it stop and return a scoped finding to the Founding Engineer. That finding was returned and the Founding Engineer authorized the edit: the defect *is* a missing build variable, and the archived `add-mobile-backend-environment-selector` design forbids the alternative repair (a runtime fallback to `APP_VARIANT`). The edit adds build variables only — no job, trigger, runner, permission, secret, or step change.
- Verification: focused mobile Jest suites, the mobile static gates, OpenSpec validation, and the exact-head native E2E job on both platforms.
- No API/OpenAPI or generated-client change, database schema/migration change, dependency upgrade, backend lifecycle change, Maestro retry/sleep/assertion change, app/EAS/Firebase config change, infrastructure change, or legacy Flutter change.
