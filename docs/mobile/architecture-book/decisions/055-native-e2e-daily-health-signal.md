# ADR 055 — Native E2E is a conditional daily health signal

## Context

Android and iOS native E2E exercise the complete application, backend, build toolchain, and device runtime, but each cold platform run is too expensive and environment-sensitive to gate ordinary feature delivery. Fast pull-request checks already protect types, lint, unit/component/integration behavior, Maestro selectors, the shell harness, and the workflow contract.

## Decision

### Daily and manual cadence

The native workflow has one daily schedule and an explicit manual dispatch. It has no push, pull-request, branch, or label trigger. A scheduled attempt runs both Android and iOS only when a relevant path changed on `main`; manual dispatch always runs both platforms against a required ref or SHA.

### Previous-attempt boundary

Scheduled detection compares current `main` with the `head_sha` of the preceding scheduled run by run number, regardless of that run's conclusion. The first scheduled attempt runs both platforms. An unavailable comparison commit fails preparation visibly instead of silently skipping. Relevant paths are `mobile/**`, `openapi/**`, `server/**`, `ci/e2e-server.sh`, `ci/generate-dummy-firebase-key.sh`, `.nvmrc`, and the native workflow itself: these are the app, contract, backend, lifecycle, toolchain, and controller inputs read by the job graph.

### One immutable target

Preparation resolves one commit SHA before native runners are allocated. The server image and both platform jobs check out and identify that SHA. A manual ref is passed through action inputs and environment, never interpolated into shell source; an invalid ref fails in preparation.

### Baseline and native evidence

Ordinary feature proof is the fast baseline. Applicable user-facing work still commits a meaningful shared Maestro flow, while selector, harness, workflow-structure, unit/component/integration, type, and lint checks protect it before merge. Native results are maintenance health evidence from the next relevant daily attempt or a deliberate manual dispatch, not required proof for an ordinary feature head.

### Concurrency and evidence

Daily and manual invocations share one concurrency group with cancellation disabled. Runs queue instead of overlapping or discarding in-progress evidence. Both platform jobs retain Maestro debug output and server logs on failure.

## Alternatives

- A fixed 24-hour window was rejected because delayed schedules can miss changes.
- The last successful run was rejected because a failure would force repeated native allocation without new work.
- A writable branch, tag, artifact, or cache checkpoint was rejected because it adds mutable state and write permissions.
- A pull-request label was rejected because it recreates an exact-head native merge loop.
- Weekly iOS or overlapping platform policies were rejected because cross-platform health and complete evidence are the purpose of the signal.

## Consequences

Feature delivery gets deterministic fast gates without consuming native runners. Runtime regressions may be discovered after merge by the daily signal, so maintenance owns scheduled failures and their retained artifacts. E2E-focused changes can dispatch an exact implementation SHA for diagnosis, but that evidence remains informational.

## Revisit if

Revisit when native execution becomes fast and reliable enough to fit the normal feedback budget, or when a release-risk policy requires a separate release-candidate gate. Do not turn the daily workflow into an ordinary feature gate without replacing this ADR.
