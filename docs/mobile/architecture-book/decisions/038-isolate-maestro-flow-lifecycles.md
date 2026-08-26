# 038 — Isolate Maestro flow lifecycles

## Status

Accepted.

## Context

On iOS 26, Maestro 2.8.0 can lose its XCTest driver during a directory suite and leave later flows connected to a dead local port. Retrying that whole directory can mask a real assertion failure. The E2E backend lifecycle is independent and already single-sourced by `ci/e2e-server.sh`.

## Decision

Run each top-level `mobile/.maestro/*.yaml` file in lexical order through a separate Maestro process while booting, seeding, and tearing down the shared backend exactly once. Every flow remains responsible for starting with `clearState` where durable state isolation is required; no flow is omitted or made optional.

Normal local and Android runs attempt each flow once. iOS CI may request up to four attempts per flow, but the harness retries only when Maestro 2.8.0 output positively identifies a first-`launchApp`/`setPermissions` XCTest driver transport failure and contains no assertion-failure evidence. Assertion, application, and unknown failures are terminal immediately.

Keeping one directory-scoped Maestro process was rejected because it reuses the failed driver lifecycle. Retrying every failure or the whole suite was rejected because it can hide application regressions. Restarting the backend for every flow was rejected because server lifecycle and device-driver lifecycle are separate concerns.

## Consequences

Each flow gets a fresh Maestro/XCTest lifecycle, and the first genuine flow failure remains the job result. Per-flow startup adds runtime, while the shared server remains single-lived. The pinned Maestro version and focused fake-process proof make the text classifier reproducible and default unknown output to failure.

## Revisit if

Maestro documents a fix for directory-suite XCTest lifecycle reuse on iOS 26 and a pinned upgrade passes repeated full-directory execution on the GitHub-hosted macOS runner without driver loss or broad retries.
