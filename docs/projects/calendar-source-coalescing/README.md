---
kind: project
status: draft
---

# Calendar-source download coalescing

Backend-only exploration for TIM-541. Recommendation: measure effective-request reuse,
then introduce Redis distributed single-flight and a short, bounded successful-download
cache. Calendars remain independent. No implementation is authorized by this document.

Planning state: awaiting-decision-approval. Implementation dispatch: forbidden.

## Review index

- [Product direction](product.md): P01–P03 and go/kill criteria.
- [Owner questions and answers](research/owner-answers.md): constraints supplied on 2026-09-27.
- [Repository evidence](research/evidence.md): source revision and uncertainty boundaries.
- [Five-option comparison](research/options.md): correctness and operational tradeoffs.
- [Target design](design.md): download boundary, identity, failure isolation and metrics.
- [D01 — Sharing boundary](decisions/D01-download-boundary.md).
- [D02 — Redis and bounded lifetime](decisions/D02-redis-lifetime.md).
- [D03 — Evidence and rollout](decisions/D03-measurement-rollout.md).
- [Staged validation plan](roadmap.md): proposed outcomes, gates and rollback.

## Approval and remaining decisions

Owner answers establish constraints; they do not constitute approval of the complete
proposal. Product and D01–D03 remain proposed pending explicit owner review. Canonical
implementation tickets are intentionally deferred until approval; this is an exploration.

Approve, revise, pause or kill the proposed direction and each decision. In particular,
approve the provisional eligibility/parse-validation rule in D01, memory admission and
fail-open behavior in D02, and the measurement-based expansion gate in D03. Numeric
memory and payload limits, provider allowlist and promotion thresholds must be chosen
from shadow evidence before live rollout; no infrastructure allocation is assumed.

Sensitive surfaces considered: credential-bearing URLs, fetch failure semantics and
Redis shared with queue workloads. No API contract, migration, native/store configuration,
workflow, infrastructure, legacy Flutter or Architecture Book rule is changed.

Residual risks: on-access demand may offer little short-window reuse; cache bytes can
consume queue headroom; request identity omissions can mix sources; new failure-sharing
behavior can amplify one bad response. The staged plan tests each before broad exposure.
