## Why

PR #273 is open, non-draft, and mergeable at exact head
`22192efb5752e407634c2df7b783a55f778a483a`, but its labelled Android and iOS native E2E jobs
fail at the calendar import because their release-config development apps compile without ADR
043's independent development backend capability. The workflow currently supplies the
development identity and local API URL while `expo config` resolves
`extra.backendEnvironmentCapability=production`, so the exact-head native gate cannot authorize
merge.

## What Changes

- Add `BACKEND_ENVIRONMENT_CAPABILITY: development` to each Android and iOS native E2E Expo
  prebuild and release bundle/build environment that already declares
  `APP_VARIANT: development` in `.github/workflows/ci-mobile-e2e.yml`.
- Preserve the platform-specific local API URLs, development identity, release configuration,
  native runners/tooling, Maestro flows/assertions, workflow triggers/permissions, and every
  other accepted source-recovery and main-side behavior.
- Prove both platform build configurations resolve the development capability while the existing
  missing/malformed capability behavior remains production-safe.
- Archive this one-off remediation with `--skip-specs`, push without force to the existing branch
  and PR, retain `run-e2e`, and require fresh exact-head baseline CI, Android/iOS native E2E,
  Simplifier, and Reviewer evidence before the authorized autonomous squash merge.

## Capabilities

### New Capabilities

- `same-pr-native-e2e-capability-remediation`: One-off requirements for aligning PR #273's native
  E2E development identity, native config, and embedded JavaScript with ADR 043's explicit
  development backend capability, without changing product behavior or the production fallback.

### Modified Capabilities

None. The canonical mobile E2E and backend-environment requirements remain unchanged; this
operational delta repairs how the existing PR's scheduled build supplies their accepted inputs.

## Impact

- Existing PR #273 and branch
  `TIM-186-prod-health-investigation-at-rentr-e-2026-write-docs-investigations-2026-08-25-rentree-prod-health-report`
  only; no replacement PR, rebase, or force-push.
- `.github/workflows/ci-mobile-e2e.yml` is the sole authorized implementation surface and is a
  sensitive CI surface requiring extra scrutiny. Only four existing build-step environments may
  gain the explicit capability value.
- `mobile/app.config.ts` and its missing/malformed → production fallback remain unchanged.
  `docs/mobile/architecture-book/` remains unchanged in substance: ADR 043 stays the backend
  environment capability/reset decision and ADR 044 stays source recovery.
- `openapi/openapi.json`, `mobile/src/api/generated/`, local API URLs, workflow triggers,
  permissions, runners, E2E flows/assertions, migrations, credentials/certificates,
  `mobile/firebase/`, Terraform/Kubernetes, deploy behavior, production data, dependencies,
  background operations, and legacy Flutter are out of scope.
- No human-only credential, device-install, or console-registration step is introduced, so no
  `(HUMAN: ...)` inbox note or separate QA gate applies.
