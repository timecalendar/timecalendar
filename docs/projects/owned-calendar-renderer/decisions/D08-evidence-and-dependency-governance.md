---
kind: decision
id: D08
status: approved
traces-to: [P01, P03, P04, P05, P07, P08]
supersedes: []
---

# D08 — Gate architecture and launch on reproducible evidence

## Context and evidence

The product retains 29 research rows and six architecture questions. No release baseline,
production percentile fixture sizes, or owned-renderer human device pass is available. Existing
Jest configuration gates logic at 90%, below the approved 100% deterministic-core requirement.

## Options considered

- Accept stack familiarity and average FPS: cannot establish the contract.
- Invent universal memory/overscan/zoom values now: produces unsupported acceptance thresholds.
- Stage evidence before irreversible choices and record measured thresholds: recommended.

## Decision

Use the linked acceptance plan, including explicit missing measurements and source metadata.
Before adding a native/rendering dependency, record resolved provenance/license obligations,
maintainer/review ownership and bus-factor risk, recent release/support evidence, RN/Expo/Hermes
compatibility, security advisories with disposition, binary/fingerprint cost, accessibility,
performance and removal strategy (B-012/B-014). Existing dependencies get the same relevant audit;
presence is not automatic approval. Engineering owns this dossier and an assigned maintainer must
be named before acceptance. Reject incompatible licensing, unresolved release-blocking security
issues, unsupported runtimes or an unowned upgrade/removal path.

## Tradeoffs and consequences

Evidence collection takes real devices and authorized aggregate workload output. The plan does
not claim those resources are currently available. Numerical tuning/budgets require a recorded
review round after measurements; no guessed thresholds become approved by approving this process.
Preserve the repository's three durable Maestro journeys; add renderer proofs at appropriate
lower layers and in reproducible dedicated measurement harnesses, not unsolicited top-level E2Es.

## Approval

Approved by the product owner on 2026-09-12 in this project's continuation conversation:
“I hereby approve all decisions.” The owner explicitly included D04–D06 and directed that their
behavior be tested during implementation, one small ticket at a time, with owner QA, feedback,
acceptance and merge before the next ticket. This replaces the earlier pre-implementation
measurement gate; it does not claim measurements exist or waive the final product contract.

The approved architecture is the starting direction. An implementation failure is investigated
in the affected ticket. Changing an approved boundary or weakening a product requirement needs
an explicit decision update; ordinary tuning within the boundary can follow ticket QA feedback.
