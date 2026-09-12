---
kind: decision
id: D05
status: approved
traces-to: [P02, P03, P04, P05, P06]
supersedes: []
---

# D05 — Use a bounded local range and mounted working set

## Context and evidence

The current renderer receives a seven-month quarter/buffer window and mounts a configured four
pages on either side. The data hook still loads the full synced table. Neither proves bounded
renderer event retention or acceptable cost for arbitrary local-date jumps (PF-021).

## Options considered

- Full-table in-memory index: fast repeated queries after load, but JS memory/cold-start scale
  with the entire store.
- Unbounded page cache: rejected because session length becomes retained work.
- Visible-only preparation: smallest retention, but adjacent motion can outrun complete content.
- Local range queries, bounded cache and immediate adjacent pages: leading candidate.

## Decision

Start with one settled page plus immediate neighbours and at most one replacement generation.
Measure retention and continuity in the paging ticket, then again with events and dense workloads.
Query timed intersections, timed points, and date-only intersections separately through the data
seam; preserve long-event coverage. Cull visual tiles by viewport only after complete relevant
cluster layout. Semantic traversal uses its own bounded reachability strategy. Select exact
overscan, cache/node ceilings and optional SQLite indexes from query-plan and release traces.

## Tradeoffs and consequences

The initial three-page policy is approved for implementation; its performance is unmeasured.
Overscan and resource budgets are refined with ticket evidence. Data rows scanned, event payloads, visual nodes and semantic nodes need separate limits.
Range queries can still scan many rows or return dense days; no query cap may silently omit valid
events. G01–G03 must demonstrate continuity and stable memory through implementation and release QA.

## Approval

Approved by the product owner on 2026-09-12 in this project's continuation conversation:
“I hereby approve all decisions.” The owner explicitly included D04–D06 and directed that their
behavior be tested during implementation, one small ticket at a time, with owner QA, feedback,
acceptance and merge before the next ticket. This replaces the earlier pre-implementation
measurement gate; it does not claim measurements exist or waive the final product contract.

The approved architecture is the starting direction. An implementation failure is investigated
in the affected ticket. Changing an approved boundary or weakening a product requirement needs
an explicit decision update; ordinary tuning within the boundary can follow ticket QA feedback.
