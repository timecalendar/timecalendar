---
kind: decision
id: D03
status: proposed
traces-to: [P02, P03]
supersedes: []
---

# D03 — Shadow evidence before allowlisted activation

## Context and evidence

The aggregate duplicate-URL ceiling is not a cache-hit estimate. Owner reports disabled cron and identifies TIM-574 as prerequisite for reliable metrics.

## Options considered

Immediate global rollout, a fixed 30-second cache and shadow plus allowlist were compared. Only the staged option measures spread-out demand and memory before exposure.

## Proposed choice

Choose shadow histograms plus non-sliding TTL simulation, replica-correct DELTA metrics and effective-key control cohorts. Activate only after limits and safety gates are reviewed.

## Tradeoffs and consequences

Adds measurement work before savings. No arbitrary reduction target; owner sets expansion tolerances from baseline. Re-measure after cron activation and keep a bypass kill switch.

## Approval

Pending explicit owner approval of this record. Owner constraints are recorded in
[the answer record](../research/owner-answers.md); full proposal approval is not inferred.
