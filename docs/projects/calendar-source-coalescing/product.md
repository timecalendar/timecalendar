---
kind: product
status: draft
decision: pending
---

# Product direction

## Problem and evidence

Repeated calendar records may download identical upstream schedules. The supplied
14-day cohort contains 84,412 active calendars, 46,416 distinct stored URLs and 50,183
calendars in duplicate-URL groups. The arithmetic ceiling is approximately 45% fewer
calendar-level downloads if every duplicate were reusable. Rouen contributes 8,969 active
calendars and 2,753 distinct stored URLs. These are owner-supplied aggregates, not fresh
measurements from this investigation. Stored URL counts do not establish effective-key
reuse, arrival overlap, bytes saved or observed upstream HTTP reduction.

The owner reports on-access production fetching with background sync disabled. A 30-second
cache can therefore miss most duplicate demand. The opportunity must be measured.

## Users and desired outcomes

Students retain independently named calendars and independent event/change histories.
The service and universities benefit from less redundant transport work.

### P01 — Independent calendars with equivalent content

Share only eligible upstream download results. Every calendar parses, transforms, compares,
persists and emits its own changes. Verify two calendars with one request key preserve
independent tokens, names, content, logs, subjects and scheduling metadata, including when
one transaction fails or one caller cancels.

### P02 — Measurable upstream work reduction

Measure actual HTTP attempts per eligible calendar download demand, split by school and
user/cron/create trigger. Demonstrate reduction against comparable bypass cohorts and
report exclusions, cache hits, joined flights, retries and fallback attempts separately.
The 45% aggregate ceiling is not a promised result or an acceptance target.

### P03 — Bounded freshness and reversible operations

Reuse successful data for a short absolute lifetime, initially around two minutes, always
strictly below the resolved strategy's minimum sync interval. Keep failures uncached,
queue resource headroom protected, and a tested immediate bypass switch. Verify no increase
in incorrect events or cross-credential sharing; establish latency/error tolerances before
live expansion from measured baseline.

## Appetite and constraints

Redis-only initial design with expiring data; no persistent source table or migration.
Backend scope only. Independent auth-path cleanup (TIM-573) and metric temporality work
(TIM-574) are external prerequisites to reconcile, not tasks created here.

## In scope

Effective-request identity, short result reuse, distributed coordination, shadow measurement,
per-calendar isolation, CI/Reviewer evidence and staged rollout planning.

## Out of scope and non-goals

Calendar merging, parsed-event caching, URL removal/privacy cleanup, source editing UI,
client changes, API changes, cron activation, runtime implementation, deployment and
infrastructure changes. Full calendar URLs are permitted by product policy.

## Assumptions and unknowns

Owner-reported absence of custom authentication must be reconciled with code that still
supports Basic auth. Effective reuse distribution and response sizes remain unmeasured.
Existing 30/60-minute sync pacing remains intact; cache hits may add up to the cache window
to schedule age until the next independent calendar sync.

## Alternatives

Do nothing has zero new failure modes but retains duplication. In-process single-flight is
the smallest intervention but only catches simultaneous same-process work. Queue regrouping
and a persistent source model are disproportionately invasive for retrieval-only sharing.

## Risks and kill criteria

Pause live adoption if bounded windows show negligible savings, memory exceeds safe queue
headroom, or the split changes failure classification. Kill this approach if safe request
identity cannot be proven or freshness/latency regressions cannot be controlled. Never extend
TTL toward the sync interval simply to manufacture a favorable hit rate.

## Recommendation

Proposed go for measurement and a reversible Redis pilot, conditional on D01–D03 approval
and measured benefit. Do not approve broad live rollout from stored-URL counts alone.

## Approval

Pending explicit owner approval of this product document. The 2026-09-27 answer set in
[owner answers](research/owner-answers.md) supplies constraints, not blanket plan approval.
