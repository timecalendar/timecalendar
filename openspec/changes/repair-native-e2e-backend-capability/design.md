## Context

The backend-environment selector deliberately separates authorization from app identity. `mobile/app.config.ts` accepts `BACKEND_ENVIRONMENT_CAPABILITY`, normalizes only `development | preview | production`, exposes the result as `extra.backendEnvironmentCapability`, and fails missing or malformed input closed to `production` (ADR 043). With fresh storage, that capability selects the default environment: development selects the compiled local URL, while production selects the production API.

The native E2E workflow builds release-configuration development binaries without Metro. Both platform jobs currently pass `APP_VARIANT=development` to prebuild and native compilation and pass a platform-local `EXPO_PUBLIC_API_URL` to compilation, but neither job passes the independent capability. The resulting binary therefore has development identity and a local URL that runtime authorization cannot select. Android and iOS both fail the seeded `dev-import` route against production rather than the harness server.

This host cannot execute Android emulators or iOS simulators. The implementation can prove workflow/config wiring deterministically here; the definitive request-path proof must run in the two labelled PR jobs on the exact branch head.

## Goals / Non-Goals

**Goals:**

- Compile both native E2E binaries with an explicit development backend capability across every relevant Expo-config evaluation.
- Preserve the independent, fail-closed capability model and production dev-import security boundary.
- Make omission from either job a fast deterministic regression failure.
- Prove the repaired binaries against the seeded local server on both native CI platforms.

**Non-Goals:**

- Change product onboarding, dev-import runtime behavior, environment selection/reset behavior, or backend APIs.
- Infer capability from `APP_VARIANT`, URL, scheme, identity, Firebase, `__DEV__`, or OTA metadata.
- Change the missing/malformed production fallback or any preview/production build profile.
- Touch OpenAPI/generated code, schema/migrations, Firebase files, deployment config, secrets, or legacy Flutter.

## Decisions

## Decision 1 — Scope the capability at each native E2E job

Set `BACKEND_ENVIRONMENT_CAPABILITY: development` in the job-level `env` of both `e2e-mobile-android` and `e2e-mobile-ios`. Job scope covers `expo prebuild`, Gradle/Xcode release compilation, and any future config-reading step in the same E2E build lane without duplicating the authorization input across individual steps. The jobs already exist only to build and run the development app identity, so this scope cannot affect preview or production profiles.

Keep `APP_VARIANT` and `EXPO_PUBLIC_API_URL` at their existing step scopes. They serve separate concerns: identity/native exceptions and platform-specific bundle URL. Do not change `app.config.ts` to infer development capability from either value; that would violate ADR 043 and weaken the fail-closed boundary outside this workflow.

Alternative: repeat the capability on prebuild and native build steps. Rejected because it creates four independently drifting declarations and leaves future config-evaluation steps unprotected.

Alternative: change the config default or derive capability from `APP_VARIANT`. Rejected because an omitted authorization input must remain production-locked and identity is explicitly not authorization.

## Decision 2 — Guard workflow scope and resolved config deterministically

Extend `mobile/e2e/test_ci_mobile_e2e.sh`, the existing workflow-contract regression, to assert exactly one development capability declaration in each native job's job-level environment and no reliance on a global or production-facing default. Pair that structural proof with the existing focused app-config test/Expo config evaluation showing that the explicit input resolves `extra.backendEnvironmentCapability=development` and that missing or malformed values remain `production`.

The regression should fail with a job-specific message if either declaration moves out of the intended job, disappears, or changes value. Keep the test dependency-free beyond the tools already available in the mobile CI lane; a new YAML parser dependency is disproportionate for two stable job blocks.

Alternative: assert only two raw string occurrences. Rejected because declarations could move to the wrong scope while preserving the count.

Alternative: rely only on the slow labelled native jobs. Rejected because a static config omission is deterministic and should fail in the standard mobile gate before consuming two cold native runners.

## Decision 3 — Use exact-head native dev-import as the integration proof

Add the `run-e2e` label after implementation so the PR head builds fresh Android and iOS binaries. Green `Run mobile E2E (Android)` and `Run mobile E2E (iOS)` jobs are required. Their existing `activity/import-baseline.yaml` path opens the seeded dev-import link after fresh storage; success proves the compiled development capability selected the respective `10.0.2.2:3005` or `localhost:3005` harness endpoint rather than production.

Do not weaken Maestro assertions or add retries for this repair. If either platform still reports `dev-import-error`, inspect app config and server logs on that exact head and repair the build wiring.

## Decision 4 — Record the completed E2E build tuple without a new ADR

Update the testing architecture page to describe the complete release-config E2E tuple: development identity, explicit development backend capability, and platform-local compiled URL. Record the rule correction in the Architecture Book changelog. This restores conformance with accepted ADR 043 rather than introducing a costly-to-reverse decision, so no new ADR is warranted.

## Risks / Trade-offs

- **[Capability leaks into production or preview]** → Declare it only inside the two native development E2E jobs; retain production fallback tests and review the sensitive workflow diff.
- **[Prebuild and compilation resolve different config]** → Use job-level scope so every child step inherits the same capability.
- **[Static workflow test passes at the wrong YAML scope]** → Inspect each named job block rather than counting the string globally, then pair it with resolved config behavior.
- **[Local checks cannot prove the native request path]** → Require both labelled exact-head native jobs and retain their server/debug artifacts on failure.

## Migration Plan

Land the workflow declaration, focused regression, and architecture documentation together. Push the implementation, add `run-e2e`, and require both native jobs to pass on the exact head before review/merge. No runtime data, API, schema, native dependency, store submission, OTA publish, or production deploy migration exists.

Rollback is a repository revert. It would restore the known-broken development E2E import path but cannot alter production behavior because the capability is confined to CI jobs.

## Open Questions

None. The Founding Engineer supplied the intended capability, platform URLs, proof jobs, and production-safety boundary.
