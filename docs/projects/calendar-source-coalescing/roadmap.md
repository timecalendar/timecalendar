---
kind: roadmap
status: draft
---

# Staged delivery and validation proposal

Exploration only: these are candidate outcomes and validation gates, not dispatched work
or approved canonical implementation tickets. Produce ticket documents after product and
D01–D03 approval and another current-main reconciliation.

## Sequencing principles

Keep each calendar independent (P01), demonstrate actual network savings (P02), and bound
freshness/resources with immediate bypass (P03). No migration or client work is required.

## Proposed stages

| Stage | Demonstrable outcome | Evidence and exit gate |
| --- | --- | --- |
| 0: prerequisites | Reliable measurement and understood auth behavior | Verify TIM-574 metric correctness across replicas; reconcile TIM-573 removal. If auth remains, prove bypass. Confirm current main retry behavior and existing claim/transaction tests. |
| 1: shadow | Quantified opportunity by effective request | Extract identity/download seam with behavior parity in a future change. Observe same-key age and response sizes for a representative full weekly usage cycle; separate user/cron/create and school, missing history, failures and exclusions. Simulate absolute windows. No suppressed requests. |
| 2: bounded local proof | Redis failure cannot corrupt calendar state | CI runs two independent workers against Redis and deterministic synthetic upstreams. Prove one request on healthy same-key overlap, separate requests for credential/config/version differences, stale-owner rejection and independent calendar commits. Validate non-sliding TTL, leader/follower cancellation, timeout, terminal/transient retries, malformed/empty bodies, eviction and fail-open. |
| 3: allowlisted live pilot | Measured savings with acceptable freshness | Owner approves chosen schools, around-2m TTLs below strategy intervals, byte/key/waiter limits, queue headroom and numeric error/latency tolerances based on stages 1–2. Separately authorize activation. Use effective-key bypass control and comparable traffic periods. |
| 4: expand or stop | Safe sustained reduction at useful coverage | Reviewer assesses A/D reduction, sample sizes, cohort mix, error/freshness evidence, queue health and rollback drill. Owner decides expand, revise, pause or kill. Repeat evidence when cron begins; cron activation is outside this plan. |

## Measurement and acceptance

Do not use 45% as an expected result. Required report: eligible/all demand, actual HTTP
attempts and bytes, H/D, J/D, retry/fallback rate, A/D treatment-versus-control, per-school
and per-trigger gaps, payload/resident sizes and Redis/BullMQ headroom. Include confidence
and missing-history bias. See design.md for the non-sliding TTL simulation requirement.

Zero known credential mixing, cross-calendar writes or stale-owner overwrites is mandatory.
Freshness age must remain within the approved absolute lifetime. Numeric savings, latency,
error and resource expansion gates remain evidence-derived decisions before live use.
A safety failure disables sharing immediately; low benefit pauses expansion.

## Parallel work

Auth cleanup and metrics correction are independently owned prerequisites. No tickets are
created here. Delivery can later separate transport correctness tests from shadow dashboards
once the identity contract is approved; do not split across conflicting fetcher edits.

## Rollout gates

Planning approval is separate from merge and from live activation. CI plus Reviewer own
machine-verifiable proof; no dedicated QA role is assumed. No device or console work is
required for this backend exploration. Any later human-only client validation belongs in
the migration inbox and must not block unrelated implementation.

Test rollback by disabling both reads and publication under load, letting flights finish
within budget, and checking continued independent sync with no Redis flush or DB repair.
Cache loss must approach bounded existing fetch behavior rather than stall user requests.

## Replanning notes

Reopen D01 for new auth, fetcher options or strategy transformation behavior. Reopen D02
if shared Redis cannot support safe admission or larger windows appear necessary. Reopen
D03 when cron/traffic mix or telemetry semantics change. Canonical epics/tickets await
approval; their absence intentionally prevents a readiness claim.
