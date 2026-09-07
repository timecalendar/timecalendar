---
kind: epic
id: E03
status: approved
traces-to: [P01, P02, P03, D01, D02, D04]
depends-on: [E02]
---

# E03 — Gate startup and automate acceptance

## Outcome

The application exposes no migration consumer until one terminal result exists, then opens normally
and delivers queued reports independently; the complete automated failure matrix is release-gated.

## Demonstration

Fresh install, genuine upgrade, interrupted upgrade, settled relaunch, environment reset, offline
launch, and report reconnect scenarios all traverse one ordered bootstrap without duplicate imports,
premature sync/onboarding/changelog/push work, or user-facing migration UI.

## Definition of done

Bootstrap ordering is binding and tested, report delivery is independent/idempotent, and one
automated suite covers the technical fixture and privacy floor on the release head.

## In scope

Root readiness gate, splash retention, consumer ordering, report delivery worker, startup variants,
integrated crash/resource/privacy tests, and Architecture Book enforcement.

## Out of scope

Signed-device execution, public-store submission, production deployment, rollout widening, and
legacy cleanup.

## Risks and boundaries

Startup deadlock and environment leakage are primary risks. No fallback may expose consumers before
terminalization or reopen migration for report delivery.

## Tickets

- [T06 — Integrate the ordered bootstrap gate](T06-ordered-bootstrap-gate.md)
- [T07 — Gate the complete automated acceptance matrix](T07-automated-acceptance-matrix.md)
