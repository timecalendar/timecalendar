---
kind: decision
id: D02
status: proposed
traces-to: [P01, P03]
supersedes: []
---

# D02 — Bounded Redis flight and result reuse

## Context and evidence

Owner excludes a persistent source model and reports distributed, on-access traffic. Existing interactive fetch budgets are short.

## Options considered

Compare process-only, Redis, queue-keyed and persistent-source alternatives in research/options.md. Prefix-only isolation is insufficient for memory protection.

## Proposed choice

Choose Redis ownership-checked publication, absolute expiry around two minutes initially, per-strategy strict cap, explicit memory admission and bounded fail-open. No initial process cache.

## Tradeoffs and consequences

Extra Redis latency and memory buy cross-pod and temporal reuse. Availability failures permit duplicate requests; no exactly-once claim. Measured budget limits are a live-rollout prerequisite.

## Approval

Pending explicit owner approval of this record. Owner constraints are recorded in
[the answer record](../research/owner-answers.md); full proposal approval is not inferred.
