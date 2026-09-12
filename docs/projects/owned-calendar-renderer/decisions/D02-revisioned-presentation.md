---
kind: decision
id: D02
status: approved
traces-to: [P02, P03, P05, P06]
supersedes: []
---

# D02 — Coordinate navigation and local data through revisioned presentation

## Context and evidence

The current controller calls goToDate and separately sets anchorDate/visibleDate. Its visible
callback updates the heading only across month boundaries. Synced replacement uses a SQLite
transaction, but separate hooks do not establish a unified settled UI revision.

## Options considered

- Retain ref commands plus independent state: familiar, but competing owners and callback races.
- Expose a larger imperative handle: makes operations explicit but still needs versioning and
  duplicates state reconciliation.
- Use controlled revisioned intents and settled presentation snapshots: recommended (B-006).

## Decision

The screen/controller owns one transition reducer and committed date/environment/data model.
The facade consumes revisioned navigation intents and emits idempotent settled results. Internal
native scroll refs are allowed; no public calendar-kit-compatible imperative API survives.
Build a complete destination from local data and discard stale completions. Agenda active-section
feedback participates in the same date context. Persist mode/zoom/weekend preference through the
existing settings seam; keep restart scroll behavior per product.

## Tradeoffs and consequences

This requires explicit cancellation, stale-query protection and UI-thread commit acknowledgement.
React state batching alone cannot prove frame atomicity. The settled model must include the
screen heading and semantic context. Measurement must verify no intermediate wrong-date frame,
including rapid Today/deep-link/resize sequences and data removal during navigation.

## Approval

Approved by the product owner on 2026-09-12 in this project's continuation conversation:
“I hereby approve all decisions.” The owner explicitly included D04–D06 and directed that their
behavior be tested during implementation, one small ticket at a time, with owner QA, feedback,
acceptance and merge before the next ticket. This replaces the earlier pre-implementation
measurement gate; it does not claim measurements exist or waive the final product contract.

The approved architecture is the starting direction. An implementation failure is investigated
in the affected ticket. Changing an approved boundary or weakening a product requirement needs
an explicit decision update; ordinary tuning within the boundary can follow ticket QA feedback.
