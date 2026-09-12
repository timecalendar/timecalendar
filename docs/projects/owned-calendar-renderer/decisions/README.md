# Architecture decision review

Product and D01–D08 are approved on 2026-09-12. The owner explicitly moved D04–D06 evidence
collection into implementation and requires a small-ticket QA/feedback/acceptance/merge loop.
The records preserve their alternatives and disclose unmeasured claims. Approval does not waive
correctness, accessibility, performance or release evidence.

| Decision and exact file                                                                                              | Recommendation                                                | Main alternative / cost                                           |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| [D01 — Use a validated calendar domain without rewriting stored events](./D01-validated-calendar-domain.md)          | Validated timed/date-only domain; preserve stored rows        | Keep mixed type, or expand to a storage/API rewrite               |
| [D02 — Coordinate navigation and local data through revisioned presentation](./D02-revisioned-presentation.md)       | One revisioned navigation/data snapshot; no public ref API    | Independent ref/state updates retain coordination risks           |
| [D03 — Retain the Expo 56 Hermes and New Architecture runtime](./D03-runtime-baseline.md)                            | Retain Expo 56, Hermes and New Architecture                   | Runtime downgrade or extra engine expands compatibility work      |
| [D04 — Use owned native views with UI-thread gestures](./D04-view-renderer-and-gestures.md)                          | RN views with UI-thread gestures; validate per ticket         | Compare alternatives if measured behavior fails                   |
| [D05 — Use a bounded local range and mounted working set](./D05-bounded-range-working-set.md)                        | Local range queries and immediate adjacent pages              | Full-store indexing costs memory; visible-only risks late content |
| [D06 — Use one chronological representation with independent failure recovery](./D06-chronological-accessibility.md) | One chronological native representation, independent recovery | Start with ordered targets; reconsider if native QA fails         |
| [D07 — Use a coordinated clean replacement and compatible native binaries](./D07-clean-native-cutover.md)            | Coordinated replacement and fresh compatible binaries         | Dual renderer conflicts with P08; component-only swap misses gaps |
| [D08 — Gate architecture and launch on reproducible evidence](./D08-evidence-and-dependency-governance.md)           | Reproducible evidence and dependency ownership gates          | Familiarity or guessed thresholds cannot prove acceptance         |

## Approval and follow-through

The owner stated “I hereby approve all decisions” and explicitly included D04–D06. Implement the
selected approaches incrementally. A separate competing prototype is unnecessary when a brick
passes its acceptance; investigate alternatives when an observed failure justifies it.

The six original architecture questions map to D05 (PF-021), D02 (B-006), D03 (B-010),
D04 (B-011), and D08 (B-012/B-014). D01, D06 and D07 cover domain, accessibility and clean cutover.
[The roadmap](../roadmap.md) assigns evidence to ordered tickets. Global records describe current
code and are reconciled as the affected implementation lands, preserving historical evidence.
