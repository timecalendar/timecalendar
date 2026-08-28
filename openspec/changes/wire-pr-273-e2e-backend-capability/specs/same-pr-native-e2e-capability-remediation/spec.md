## ADDED Requirements

### Requirement: Native E2E build phases receive the explicit development capability

PR #273's Android and iOS native E2E workflow SHALL set
`BACKEND_ENVIRONMENT_CAPABILITY=development` in every Expo prebuild and release bundle/build
environment that already sets `APP_VARIANT=development`. The value SHALL remain step-local and
SHALL NOT be inferred from app identity, local API URL, OTA metadata, or development mode.

#### Scenario: Android native config and bundle agree

- **WHEN** the Android native E2E job runs its development prebuild and release APK build
- **THEN** both step environments explicitly carry the development backend capability
- **AND** the compiled release-config development APK resolves
  `extra.backendEnvironmentCapability=development`

#### Scenario: iOS native config and bundle agree

- **WHEN** the iOS native E2E job runs its development prebuild and Release simulator app build
- **THEN** both step environments explicitly carry the development backend capability
- **AND** the compiled release-config development app resolves
  `extra.backendEnvironmentCapability=development`

### Requirement: Production-safe fallback and existing behavior remain intact

The remediation SHALL leave `mobile/app.config.ts` and its missing, malformed, or unknown
capability → production behavior unchanged. It SHALL preserve both platform-local API URLs,
development identity, release configuration, native tooling, server lifecycle, Maestro flows and
assertions, workflow triggers, permissions, runners, and every accepted source-recovery and
main-side contract.

#### Scenario: Capability is absent or malformed

- **WHEN** app config is evaluated without a valid `BACKEND_ENVIRONMENT_CAPABILITY`
- **THEN** it continues to resolve `extra.backendEnvironmentCapability=production`
- **AND** no identity, URL, or runtime inference enables a non-production backend

#### Scenario: Sensitive workflow diff stays narrow

- **WHEN** the remediation diff is reviewed
- **THEN** `.github/workflows/ci-mobile-e2e.yml` contains only the four authorized capability
  additions outside the OpenSpec lifecycle artifacts
- **AND** triggers, permissions, runners, commands, local API URLs, flow assertions, failure
  artifacts, and all excluded product/config/contract surfaces remain unchanged

### Requirement: Exact-head gates precede the authorized merge

The one-off remediation SHALL be strictly validated and archived with `--skip-specs`, pushed
without force to PR #273's existing branch, and proven by fresh exact-head baseline CI plus both
labelled Android and iOS native E2E jobs. Fresh Simplifier and Reviewer passes SHALL follow before
Reviewer may exercise the existing autonomous squash-merge grant. Apply SHALL NOT open another PR,
merge, deploy, or introduce a separate QA gate.

#### Scenario: Native import succeeds on both platforms

- **WHEN** the final exact head runs the labelled native workflow
- **THEN** Android and iOS both pass the unchanged calendar import and source-recovery journeys
- **AND** their job evidence is attributable to that exact head SHA

#### Scenario: Old evidence cannot authorize merge

- **WHEN** a proposal, implementation, archive, simplification, or repair commit changes the PR
  head
- **THEN** prior-head CI and review evidence is rejected and required gates rerun against the new
  exact head before squash merge
