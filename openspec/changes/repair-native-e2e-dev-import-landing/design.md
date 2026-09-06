## Context

The native E2E suite proves the app against a local seeded backend. Two build variables put it there, and they are load-bearing together:

- `EXPO_PUBLIC_API_URL` — the platform-correct local URL, baked into the release bundle.
- `BACKEND_ENVIRONMENT_CAPABILITY` — parsed by `app.config.ts` into `extra.backendEnvironmentCapability`, which decides *which environments the build may select at all*.

At runtime `getEffectiveBackendApiUrl()` composes them: `parseBackendEnvironment(<stored selection>, capability)` picks an environment, then `resolveBackendApiUrl(environment, EXPO_PUBLIC_API_URL)` turns it into a URL. `getAllowedBackendEnvironments("production")` is `["production"]`, so with a `production` capability the stored selection is irrelevant, the default is `production`, and the resolver returns `PRODUCTION_API_URL` — never consulting the baked local URL.

`parseBackendEnvironmentCapability(undefined)` is `production`. That default is deliberate and correct: it is the safe answer for a shipped binary. Its cost is that omitting the variable is indistinguishable from asking for production, and nothing at build time objects.

`.github/workflows/ci-mobile-e2e.yml` omitted it. Every other dev-variant entry point sets it — `package.json`'s `start`/`android`/`ios`, and the `development`/`preview`/`production` profiles in `eas.json`. So the E2E build, alone, asked the live API for tokens that exist only in the local seed, received 404, and rendered `dev-import-error`.

### Why this went unattributed for five days

The failure is invisible from every artifact the harness collects. The request succeeds at the transport layer (HTTPS to a real host), so there is no cleartext or ATS violation in logcat; it never reaches the local server, so the server log is silent; and `dev-import-screen.tsx` reports the rejection only through `recordUnknownError` to Crashlytics, which an E2E build cannot surface. Each native attempt costs ~34 minutes and returns one bit.

What broke the deadlock was flow-level attribution across time rather than another attempt: run `32999041121` (2026-08-26) shows `Run import-seed.yaml... COMPLETED`, and run `33297815810` (2026-08-30) shows the same flow with the same token failing at the same assertion — bracketing the backend-environment selector, archived 2026-08-27.

## Goals / Non-Goals

**Goals:**

- Make the e2e build resolve the local seeded backend it was pointed at.
- Encode the URL/capability pairing in the `mobile-e2e` spec so the next build path cannot omit it silently.
- Cover the cause with a test that fails on the resolved URL, not on a grep.

**Non-Goals:**

- Change the runtime capability default, or add an `APP_VARIANT` fallback (see Decision 2).
- Change migration SQL, schema, API endpoints, generated clients, server fixtures, or backend lifecycle.
- Add sleeps, retries, optional steps, or weaker Maestro assertions.

## Decisions

## Decision 1 — Fix it at the build input, on all four steps

`BACKEND_ENVIRONMENT_CAPABILITY: development` joins `APP_VARIANT: development` on both platforms' prebuild step and release-build step.

The build step is the one that matters: `expo-constants` regenerates the Expo config during the bundle phase, so that is where `extra` is baked. It is also set on prebuild because `APP_VARIANT` already is, the pairing then reads as one unit at every stage, and a native attempt is too expensive to spend discovering which stage won.

## Decision 2 — Do not repair this at runtime

The tempting fix is to have `app.config.ts` infer `development` capability from `APP_VARIANT === "development"`. Rejected: the archived `add-mobile-backend-environment-selector` design states the parser "does not consult `appVariant`, OTA headers/channel, scheme, Firebase config, or `__DEV__` as a fallback." That independence is the security property that keeps a dev-variant binary from reaching a non-production backend by accident. Overturning it needs an ADR, and it would trade a CI defect for a weaker runtime boundary.

The defect is a missing build input. It is fixed where it is missing.

## Decision 3 — Test the consequence, not the variable

`mobile/ci-e2e-build-env.test.ts` reads the workflow, extracts each step that bakes `EXPO_PUBLIC_API_URL`, and pushes that step's capability and URL through the **real** `parseBackendEnvironmentCapability` → `parseBackendEnvironment` → `resolveBackendApiUrl` chain, asserting the result is the baked URL.

This fails for the actual reason the suite failed, and a capability set to the wrong lane (`preview`, a typo) fails it too — which a grep for the variable name would not. It follows the existing `app.config.test.ts` precedent of asserting cross-file build-configuration contracts, and it models the post-`clearState` empty-selection state every flow starts from.

A companion assertion pins the extracted URL list, so a workflow rename that silently matched no steps fails loudly instead of passing vacuously.

## Decision 4 — Keep the migration hardening, drop its claim

The single-flight `runMigrations()` and the import seam's readiness wait stay. Both are defensible: two callers running Drizzle against one SQLite handle is a real hazard, and `upsert` on a not-yet-created table is a real failure mode — one made worse by `runMigrations()` swallowing its own error, so a failed migration surfaces only as a mysterious downstream rejection.

What does not stay is the claim that they repair this flow. They do not, and the exact-head run confirmed it. Their spec deltas describe schema-readiness contracts that stand on their own; the proposal's "Why" no longer attributes the E2E failure to them.

## Risks / Trade-offs

- **[The capability is baked at a stage that neither step covers]** → Both prebuild and build carry it on both platforms; the native run on the exact head is the proof, and the local test proves the resolver's half independently of it.
- **[Green Android, still-red iOS, or vice versa]** → The cause is platform-independent and both platforms are fixed in the same commit, so the exact-head run must be read at flow level on **both** jobs before this is called done.
- **[Later flows fail for unrelated pre-existing reasons]** → Likely, and not a regression of this change. Run `32999041121` failed at `Tap on id: calendar-view-agenda` *after* the import preamble completed, so at least one further defect sits behind this one. It is separate work, attributed at flow level, and must not be absorbed here.
- **[A future build path omits the variable again]** → The spec now requires the pairing and the test enforces it over the workflow file.

## Migration Plan

One commit carries the workflow variables, the test, and the corrected OpenSpec artifacts, because any new commit voids the ~34-minute exact-head native gate. No data migration and no rollout act. Rollback is a repository revert.

## Open Questions

None for the diagnosed cause. Whether the flows *behind* the import preamble pass is genuinely unknown — no run has reached them since 2026-08-26 — and is scoped to follow-up work rather than assumed here.
