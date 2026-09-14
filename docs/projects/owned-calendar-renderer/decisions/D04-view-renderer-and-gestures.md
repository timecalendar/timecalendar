---
kind: decision
id: D04
status: approved
traces-to: [P01, P04, P05, P07, P08]
supersedes: []
---

# D04 — Use owned native views with UI-thread gestures

## Context and evidence

The repository already uses RN views, Gesture Handler 2.31, Reanimated 4.3 and Worklets 0.8.
The [Expo Reanimated reference](https://docs.expo.dev/versions/v56.0.0/sdk/reanimated/) and
[Gesture Handler reference](https://docs.expo.dev/versions/v56.0.0/sdk/gesture-handler/) document
these integration paths. No owned-renderer release measurements exist in this review.

## Options considered

- RN View/Text/Pressable plus Gesture Handler/Reanimated: leading candidate; one shared renderer
  and existing dependencies, but owned physics/arbitration and dense view costs.
- RN views with native ScrollView/pager motion: serious comparator, using the existing pager
  dependency; simpler native motion but one-page fling and recycling integration remain risks.
- Skia/canvas: potentially fewer visual nodes, but text, semantic hit targets and accessibility
  need another integration strategy and a new dependency.
- Separate Swift/Kotlin renderer: strongest direct native control, with two implementation and
  accessibility surfaces to maintain.
- A calendar-kit fork/wrapper: excluded by approved P08, not a viable launch alternative.

## Decision

Use owned RN views with native ScrollView/PagerView motion and Reanimated header projection
(B-011), the completed E01 implementation. T03 selected this documented alternative after owner
QA exposed custom-motion and inset defects. The existing Gesture Handler stack remains the
pinch integration path for T06; two-finger precedence must be demonstrated against both native
scroll owners before adding the rest of zoom. Keep semantic event planning off the per-frame
path. A passing slice needs no extra competing prototype. Skia/custom native requires a
documented decision change and the D08 dependency dossier.

[E01 completion and baseline](../research/results/E01/completion.md) records the implementation
and evidence boundary. The owner authorized this documentation reconciliation on 2026-09-14;
product behavior, native acceptance and final performance gates remain binding.

## Tradeoffs and consequences

The cheapest dependency footprint is not necessarily the fastest or most accessible solution.
G01–G03 evidence is collected incrementally during implementation and before launch. Native
feel, two-finger precedence, axis locking, missed deadlines, text scaling, and dense hit targets
are not established by an API comparison. Failure requires revisiting the affected implementation/decision, not weakening
P04/P05 or quietly adding another renderer.

## Approval

Approved by the product owner on 2026-09-12 in this project's continuation conversation:
“I hereby approve all decisions.” The owner explicitly included D04–D06 and directed that their
behavior be tested during implementation, one small ticket at a time, with owner QA, feedback,
acceptance and merge before the next ticket. This replaces the earlier pre-implementation
measurement gate; it does not claim measurements exist or waive the final product contract.

The approved architecture is the starting direction. An implementation failure is investigated
in the affected ticket. Changing an approved boundary or weakening a product requirement needs
an explicit decision update; ordinary tuning within the boundary can follow ticket QA feedback.
