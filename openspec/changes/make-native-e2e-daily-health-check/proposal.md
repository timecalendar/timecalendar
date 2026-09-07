## Why

Native Android and iOS E2E runs are valuable integration-health signals, but their cold builds and device startup make them unsuitable as a routine feature-merge gate. The repository needs one predictable daily signal when relevant work has landed, plus an explicit diagnostic path, while fast static and non-native checks remain the pull-request baseline.

## What Changes

- Remove push and pull-request triggers from the native E2E workflow, including the `run-e2e` label convention.
- Add one daily schedule that evaluates changes on `main` since the previous scheduled attempt and runs both native platforms only when a relevant path changed.
- Add manual dispatch with a required ref/SHA input so E2E-focused work and diagnosis can deliberately run both platforms against an exact resolved commit.
- Define concurrency and ref-resolution rules that avoid overlapping stale runs and keep every job in one invocation on the same commit.
- Keep fast unit, component, integration, type, lint, Maestro selector, harness, and workflow-structure checks as ordinary pull-request gates.
- Reconcile the Architecture Book through a new ADR, Definition of Done and testing guidance, Phase 01 and Phase 10 roadmap wording, the agent environment handbook, and the canonical mobile E2E specification.
- Extend focused, emulator-free workflow tests to prove triggers, scheduled change detection, platform cadence, manual ref behavior, concurrency, and failure artifacts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: change native CI from label/per-push and exact-head proof to a conditional daily health check with deliberate ref-selected manual dispatch, while retaining both-platform execution and failure evidence.

## Impact

- `.github/workflows/ci-mobile-e2e.yml` changes trigger, permissions, change-detection, ref resolution, job conditions, and concurrency. This is a sensitive CI surface and remains non-deploying.
- `mobile/e2e/test_ci_mobile_e2e.sh` and the baseline `.github/workflows/ci-mobile.yml` contract provide focused proof without starting an emulator or simulator.
- `docs/mobile/architecture-book/`, migration roadmap pages, `docs/agent-dev-environment.md`, and `openspec/specs/mobile-e2e/spec.md` adopt the health-signal policy and remove obsolete per-feature/per-commit guidance.
- No OpenAPI or generated client change, server schema or migration, native/store/EAS/Firebase configuration, infrastructure, production operation, credential use, or legacy Flutter change is included.
