# 038 — Isolate Maestro flow lifecycles

## Status

Accepted.

## Context

On iOS 26, Maestro 2.8.0 can lose its XCTest driver during a directory suite and leave later flows connected to a dead local port. Retrying that whole directory can mask a real assertion failure. The E2E backend lifecycle is independent and already single-sourced by `ci/e2e-server.sh`.

## Decision

Run each top-level `mobile/.maestro/*.yaml` file in lexical order through a separate Maestro process while booting, seeding, and tearing down the shared backend exactly once. Every flow remains responsible for starting with `clearState` where durable state isolation is required; no flow is omitted or made optional.

Normal local and Android runs attempt each flow once. iOS CI may request up to four attempts per flow. **Which failures are retryable is decided structurally, from Maestro's own machine-readable per-flow `commands.json`, never from stack-trace text.** A later explicit app restart begins a new classification epoch, so a completed assertion from an earlier phase does not permanently veto recovery from a later startup-transport failure. An attempt may be retried only when the final restart epoch proved nothing about the application:

1. The harness output carries no assertion-failure evidence. This guard runs first and wins outright — an attempt with assertion evidence is terminal whatever its command record says.
2. No independent command before the final startup failure has status `FAILED`. This is global: a failed assertion, application command, or interaction remains terminal even if the flow later records another restart boundary. The sole structural exception is a failed `runFlowCommand` that is still the live ancestor of the final startup command: it precedes that command at a strictly lower depth, and every intervening command remains deeper than the wrapper. Maestro can propagate the child's failure onto that still-open wrapper before serializing the child commands; a same-depth wrapper, a wrapper closed by a return to its depth or shallower, and every failed child assertion or interaction remain terminal.
3. The classifier finds the latest explicit `launchAppCommand`, `stopAppCommand`, or `openLinkCommand` at the final command's depth. From that boundary through the final command, only startup-phase commands (`defineVariablesCommand`, `applyConfigurationCommand`, `launchAppCommand`, `stopAppCommand`, `openLinkCommand`, `runFlowCommand`) and non-evaluated assertion commands may occur. Maestro records assertions as `assertConditionCommand` (`assertVisible`, `assertNotVisible` and `extendedWaitUntil` all collapse into it) and `scrollUntilVisible`; `COMPLETED` and `FAILED` are evaluated, while `RUNNING`, `PENDING` and `SKIPPED` are not. A completed assertion before the boundary belongs to the earlier phase and may be ignored; an evaluated assertion or non-startup interaction in the current epoch is terminal.
4. If no per-flow record exists at all, Maestro aborted before opening the flow and the attempt is startup-retryable. An unreadable or malformed record remains terminal.

Anything else is terminal immediately. This rule subsumes, rather than extends, the three stack-trace signatures it replaces: the session that never binds its driver port within `MAESTRO_DRIVER_STARTUP_TIMEOUT` (no record), the transport that drops on the first `launchApp` (last record `launchAppCommand`), and the simulator timeout reopening the app through a deep link (last record `openLinkCommand`). Each of those was a literal-text matcher, and each bought exactly one CI cycle before the next punctuation variant appeared — a fourth shape then arrived carrying no exception text at all, so no signature could ever have matched it. Punctuation is not a contract; the command record is.

Keeping one directory-scoped Maestro process was rejected because it reuses the failed driver lifecycle. Retrying every failure or the whole suite was rejected because it can hide application regressions. Restarting the backend for every flow was rejected because server lifecycle and device-driver lifecycle are separate concerns. Adding a fourth stack-trace signature was rejected because the failure mode is the matching strategy, not any individual pattern.

## Consequences

Each flow gets a fresh Maestro/XCTest lifecycle, and the first genuine flow failure remains the job result. Per-flow startup adds runtime, while the shared server remains single-lived.

The classifier no longer needs updating when Maestro changes its error text, and it correctly classifies a failure that emits no error text, a later restart failure after an earlier phase completed successfully, and a nested startup failure whose still-open flow wrapper carries the propagated child status. A retry always reruns the entire top-level flow in a fresh Maestro process; it never resumes inside the recorded epoch. The bound, stated plainly: **an application that deterministically fails to launch matches the startup shape too.** It is still reported red — it exhausts all four attempts and the harness exits non-zero with the original status. Retry costs attempts, never correctness. A malformed or unreadable command record is treated as terminal, so the classifier fails closed.

## Revisit if

Maestro documents a fix for directory-suite XCTest lifecycle reuse on iOS 26 and a pinned upgrade passes repeated full-directory execution on the GitHub-hosted macOS runner without driver loss or broad retries.
