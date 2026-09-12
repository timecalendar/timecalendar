---
kind: decision
id: D06
status: approved
traces-to: [P01, P02, P03, P04, P06]
supersedes: []
---

# D06 — Use one chronological representation with independent failure recovery

## Context and evidence

Product section 12 requires one chronological representation on Calendar, unaffected by zoom and
without duplicate focus trees. Current vendor tiles and agenda list do not prove that contract.
[React Native accessibility](https://reactnative.dev/docs/0.85/accessibility) documents native
semantic properties but does not establish real VoiceOver/TalkBack/Switch Control behavior.

## Options considered

- Treat recycled visual mount order as reading order: rejected because scrolling changes meaning.
- Send assistive-technology users to agenda: rejected as a separate destination/product change.
- Use one ordered native tree associated with visual event targets: preferred if all events remain
  reachable with bounded mounting and correct Voice Control hit locations.
- Use a dedicated chronological native semantic layer on the same screen: comparator if the first
  cannot pass; hide competing visual semantics and prove focus/activation geometry.

## Decision

Build one pure chronological model from the committed validated snapshot. Represent only visible
all-day rows and per-date expansion actions while collapsed. Restore focus by stable identity/date;
announce settled context once. Keep accessible date/navigation/zoom controls and the chronological
failure representation outside the visual renderer error boundary. Start with one chronological native event tree associated with visual targets. Test reachability,
focus and activation in the first event tickets, including off-viewport content. If this approach
fails, evaluate the same-screen semantic-layer alternative and update the decision before adopting
it. Do not depend on experimental focus-order APIs for launch.

## Tradeoffs and consequences

Visual culling cannot make off-viewport events unreachable. Invisible duplicate buttons are not
an acceptable shortcut: Switch Control, Voice Control, hit geometry and discoverability require
human verification. A fallback list must survive a visual-subtree failure without inheriting its
error, and all-day collapse has explicit focus rules. The native semantic strategy and dense-target behavior receive owner QA in their own tickets;
final accessibility acceptance remains required before launch.

## Approval

Approved by the product owner on 2026-09-12 in this project's continuation conversation:
“I hereby approve all decisions.” The owner explicitly included D04–D06 and directed that their
behavior be tested during implementation, one small ticket at a time, with owner QA, feedback,
acceptance and merge before the next ticket. This replaces the earlier pre-implementation
measurement gate; it does not claim measurements exist or waive the final product contract.

The approved architecture is the starting direction. An implementation failure is investigated
in the affected ticket. Changing an approved boundary or weakening a product requirement needs
an explicit decision update; ordinary tuning within the boundary can follow ticket QA feedback.
