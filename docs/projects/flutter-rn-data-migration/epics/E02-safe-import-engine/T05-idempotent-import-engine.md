---
kind: ticket
id: T05
epic: E02
status: planned
traces-to: [P01, P02, P03, D01, D02, D04]
depends-on: [T01, T02, T04]
size: L
confidence: medium
---

# T05 — Converge the idempotent import engine

## Outcome

Validated candidates converge across SQLite and MMKV under React-Native-wins semantics, recover
after any process kill, settle once, and enqueue one privacy-bounded outcome report.

## Scope

Add insert-if-absent/canonical-compare repositories, token collision enforcement, ordered SQLite
transaction, independent MMKV progress, source fingerprint/retry handling, terminalization, counts,
error codes, onboarding suppression, and report outbox creation.

## Non-goals

No root mount gate, report network worker, migration UI, source cleanup, cache import, or rollout.

## Definition of done

Every crash boundary is retry-safe; divergent targets remain byte-for-byte unchanged; identical
targets count as already present; valid siblings survive invalid ones; exactly one terminal outcome
and report id persist; terminal runs never reopen.

## Acceptance and verification

Run repository/read-back, MMKV failure, collision, retry, source-change, and report-payload tests;
inject kills before/after every journal boundary; run mobile TypeScript, lint, and coverage gates.

## Likely work sites and reading

Mobile migration engine/repositories, existing entity repositories and schema, MMKV accessors,
T01/T02/T04 contracts, technical specification sections 3–10, and Architecture Book storage/data.

## Size and confidence drivers

L: largest acceptable correctness unit because the cross-store journal invariant is only meaningful
when reviewed and tested end to end. Medium confidence until kill injection proves convergence.

## QA and sensitive surfaces

SQLite, MMKV, tokens, user content, migration telemetry, and data-loss behavior are sensitive. The
no-overwrite and no-private-diagnostics assertions are release-blocking.
